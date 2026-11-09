import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import type {
  Prospect,
  EnrichedData,
  Interaction,
  Offer,
  Project,
  Task,
  Idea,
  Decision,
  Branch,
  AutomationRule,
  AutomationLog,
  InAppAlert,
  AutomationStatus,
  InternalPhoningCampaign,
  CallResult,
  TaskPriority,
  ProspectStatus,
} from '../types/nexus';
import { DEFAULT_INTERNAL_CAMPAIGNS } from '../types/phoning';
import { DEFAULT_BRANCHES } from '../types/branches';
import { DEFAULT_AUTOMATION_RULES } from '../types/automations';
import type {
  CompanyLegalProfile,
  WebComponent,
  WebConfiguration,
} from '../types/configurator';
import {
  DEFAULT_COMPANY_LEGAL_PROFILE,
  DEFAULT_WEB_COMPONENTS,
} from '../lib/configuratorDefaults';

interface DataContextType {
  prospects: Prospect[];
  offers: Offer[];
  projects: Project[];
  tasks: Task[];
  ideas: Idea[];
  decisions: Decision[];
  loading: boolean;
  error: string | null;

  // Prospects CRUD
  createProspect: (data: Omit<Prospect, 'id' | 'ownerId' | 'ownerEmail' | 'createdAt' | 'updatedAt' | 'isArchived'>) => Promise<string>;
  updateProspect: (id: string, data: Partial<Prospect>) => Promise<void>;
  enrichProspect: (id: string, data: EnrichedData) => Promise<void>;
  toggleArchiveProspect: (id: string, current: boolean) => Promise<void>;
  deleteProspect: (id: string) => Promise<void>;

  // Interactions
  addInteraction: (prospectId: string, data: Omit<Interaction, 'id' | 'prospectId' | 'ownerId' | 'createdAt'>) => Promise<string>;
  getInteractions: (prospectId: string) => Promise<Interaction[]>;
  deleteInteraction: (prospectId: string, interactionId: string) => Promise<void>;

  // Offers CRUD
  createOffer: (data: Omit<Offer, 'id' | 'ownerId' | 'ownerEmail' | 'createdAt' | 'updatedAt' | 'isArchived'>) => Promise<string>;
  updateOffer: (id: string, data: Partial<Offer>) => Promise<void>;
  toggleArchiveOffer: (id: string, current: boolean) => Promise<void>;
  deleteOffer: (id: string) => Promise<void>;

  // Projects CRUD
  createProject: (data: Omit<Project, 'id' | 'ownerId' | 'ownerEmail' | 'createdAt' | 'updatedAt' | 'isArchived'>) => Promise<string>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  toggleArchiveProject: (id: string, current: boolean) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Tasks CRUD
  createTask: (data: Omit<Task, 'id' | 'ownerId' | 'ownerEmail' | 'createdAt' | 'updatedAt' | 'isArchived'>) => Promise<string>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  toggleTaskStatus: (id: string, currentStatus: Task['status']) => Promise<void>;
  toggleArchiveTask: (id: string, current: boolean) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Ideas CRUD
  createIdea: (data: Omit<Idea, 'id' | 'ownerId' | 'ownerEmail' | 'createdAt' | 'updatedAt' | 'isArchived'>) => Promise<string>;
  updateIdea: (id: string, data: Partial<Idea>) => Promise<void>;
  toggleArchiveIdea: (id: string, current: boolean) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;

  // Decisions CRUD
  createDecision: (data: Omit<Decision, 'id' | 'ownerId' | 'ownerEmail' | 'createdAt' | 'updatedAt' | 'isArchived'>) => Promise<string>;
  updateDecision: (id: string, data: Partial<Decision>) => Promise<void>;
  toggleArchiveDecision: (id: string, current: boolean) => Promise<void>;
  deleteDecision: (id: string) => Promise<void>;

  // Data Cleaners & Management
  cleanFakeData: () => Promise<{ deletedProspects: number; deletedCampaigns: number }>;
  seedFictionalData: () => Promise<void>;
  clearAllData: () => Promise<void>;

  // Computed metrics
  kpis: {
    activeProspects: number;
    proposalsSent: number;
    wonProspects: number;
    activeProjects: number;
    blockedProjects: number;
    deliveredProjects: number;
    todayTasks: Task[];
    upcomingTasks: Task[];
    overdueTasksCount: number;
    activeOffersCount: number;
    totalDecisionsCount: number;
  };

  // Exporters
  exportToCSV: (entityName: 'prospects' | 'offers' | 'projects' | 'tasks' | 'all') => void;
  exportToJSON: (entityName: 'prospects' | 'offers' | 'projects' | 'tasks' | 'all') => void;

  // Configurateur Web & Documents (NEXUS Digital)
  companyLegal: CompanyLegalProfile;
  updateCompanyLegal: (profile: CompanyLegalProfile) => Promise<void>;
  componentsCatalog: WebComponent[];
  updateComponentsCatalog: (catalog: WebComponent[]) => Promise<void>;
  saveProjectWebConfig: (projectId: string, webConfig: WebConfiguration) => Promise<void>;

  // Branches & Gouvernance
  branches: Branch[];
  createBranch: (data: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateBranch: (id: string, data: Partial<Branch>) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;

  // Automatisations & Alertes
  automations: AutomationRule[];
  automationLogs: AutomationLog[];
  inAppAlerts: InAppAlert[];
  createAutomationRule: (data: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>) => Promise<string>;
  updateAutomationRule: (id: string, data: Partial<AutomationRule>) => Promise<void>;
  deleteAutomationRule: (id: string) => Promise<void>;
  toggleAutomationRuleStatus: (id: string, newStatus: AutomationStatus) => Promise<void>;
  emergencyStopAutomations: () => Promise<void>;
  runAutomationSimulation: (ruleId?: string) => AutomationLog[];
  runAutomationsEvaluation: () => Promise<AutomationLog[]>;
  dismissAlert: (alertId: string) => void;
  clearDismissedAlerts: () => void;

  // Prospection Téléphonique Interne
  phoningCampaigns: InternalPhoningCampaign[];
  savePhoningCampaign: (campaign: InternalPhoningCampaign) => Promise<void>;
  deletePhoningCampaign: (id: string) => Promise<void>;
  logPhoningCall: (params: {
    prospectId: string;
    result: CallResult;
    notes: string;
    nextStep?: string;
    nextContactDate?: string;
    newProspectStatus?: ProspectStatus;
    campaignId?: string;
    campaignName?: string;
    branchId?: string;
    objectionMetId?: string;
    objectionMetTitle?: string;
    durationMinutes?: number;
    createReminderTask?: boolean;
    reminderTaskDueDate?: string;
    reminderTaskPriority?: TaskPriority;
  }) => Promise<{ interactionId: string; taskId?: string }>;
  loadedInteractions: Record<string, Interaction[]>;
  fetchInteractionsForProspects: (prospectIds: string[]) => Promise<Interaction[]>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isOwner } = useAuth();

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [branches, setBranches] = useState<Branch[]>(DEFAULT_BRANCHES);
  const [automations, setAutomations] = useState<AutomationRule[]>(DEFAULT_AUTOMATION_RULES);
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>([]);
  const [inAppAlerts, setInAppAlerts] = useState<InAppAlert[]>([]);
  const [phoningCampaigns, setPhoningCampaigns] = useState<InternalPhoningCampaign[]>(DEFAULT_INTERNAL_CAMPAIGNS);
  const [loadedInteractions, setLoadedInteractions] = useState<Record<string, Interaction[]>>({});
  const [companyLegal, setCompanyLegal] = useState<CompanyLegalProfile>(DEFAULT_COMPANY_LEGAL_PROFILE);
  const [componentsCatalog, setComponentsCatalog] = useState<WebComponent[]>(DEFAULT_WEB_COMPONENTS);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper ID generator
  const genId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Helper to remove any undefined fields before writing to Firestore
  const cleanDocumentData = <T extends object>(data: T): Record<string, unknown> => {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value !== undefined) {
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          clean[key] = cleanDocumentData(value as object);
        } else {
          clean[key] = value;
        }
      }
    }
    return clean;
  };

  // Real-time synchronization only when user is authenticated owner
  useEffect(() => {
    if (!user || !isOwner) {
      setProspects([]);
      setOffers([]);
      setProjects([]);
      setTasks([]);
      setIdeas([]);
      setDecisions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribers: (() => void)[] = [];

    // Prospects listener
    try {
      const pCol = collection(db, 'prospects');
      unsubscribers.push(
        onSnapshot(
          pCol,
          (snapshot) => {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Prospect));
            setProspects(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
          },
          (err) => {
            console.error('Prospects listener error:', err);
            try {
              handleFirestoreError(err, OperationType.LIST, 'prospects');
            } catch (handled) {
              setError((handled as Error).message);
            }
          }
        )
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'prospects');
    }

    // Offers listener
    try {
      const oCol = collection(db, 'offers');
      unsubscribers.push(
        onSnapshot(
          oCol,
          (snapshot) => {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Offer));
            setOffers(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
          },
          (err) => {
            console.error('Offers listener error:', err);
            try {
              handleFirestoreError(err, OperationType.LIST, 'offers');
            } catch (handled) {
              setError((handled as Error).message);
            }
          }
        )
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'offers');
    }

    // Projects listener
    try {
      const prCol = collection(db, 'projects');
      unsubscribers.push(
        onSnapshot(
          prCol,
          (snapshot) => {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
            setProjects(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
          },
          (err) => {
            console.error('Projects listener error:', err);
            try {
              handleFirestoreError(err, OperationType.LIST, 'projects');
            } catch (handled) {
              setError((handled as Error).message);
            }
          }
        )
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'projects');
    }

    // Tasks listener
    try {
      const tCol = collection(db, 'tasks');
      unsubscribers.push(
        onSnapshot(
          tCol,
          (snapshot) => {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
            setTasks(list.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')));
          },
          (err) => {
            console.error('Tasks listener error:', err);
            try {
              handleFirestoreError(err, OperationType.LIST, 'tasks');
            } catch (handled) {
              setError((handled as Error).message);
            }
          }
        )
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'tasks');
    }

    // Ideas listener
    try {
      const iCol = collection(db, 'ideas');
      unsubscribers.push(
        onSnapshot(
          iCol,
          (snapshot) => {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Idea));
            setIdeas(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
          },
          (err) => {
            console.error('Ideas listener error:', err);
            try {
              handleFirestoreError(err, OperationType.LIST, 'ideas');
            } catch (handled) {
              setError((handled as Error).message);
            }
          }
        )
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'ideas');
    }

    // Decisions listener
    try {
      const dCol = collection(db, 'decisions');
      unsubscribers.push(
        onSnapshot(
          dCol,
          (snapshot) => {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Decision));
            setDecisions(list.sort((a, b) => b.date.localeCompare(a.date)));
            setLoading(false);
          },
          (err) => {
            console.error('Decisions listener error:', err);
            try {
              handleFirestoreError(err, OperationType.LIST, 'decisions');
            } catch (handled) {
              setError((handled as Error).message);
            }
            setLoading(false);
          }
        )
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'decisions');
      setLoading(false);
    }

    // Settings listener for companyLegal (NEXUS Digital)
    try {
      const sRef = doc(db, 'settings', 'nexus_digital_legal');
      unsubscribers.push(
        onSnapshot(
          sRef,
          (snap) => {
            if (snap.exists()) {
              setCompanyLegal({ ...DEFAULT_COMPANY_LEGAL_PROFILE, ...snap.data() } as CompanyLegalProfile);
            }
          },
          (err) => {
            console.error('Legal profile settings listener error:', err);
          }
        )
      );
    } catch (e) {
      console.error(e);
    }

    // Settings listener for custom components catalog
    try {
      const catRef = doc(db, 'settings', 'web_components_catalog');
      unsubscribers.push(
        onSnapshot(
          catRef,
          (snap) => {
            if (snap.exists() && Array.isArray(snap.data()?.components)) {
              setComponentsCatalog(snap.data().components as WebComponent[]);
            }
          },
          (err) => {
            console.error('Catalog listener error:', err);
          }
        )
      );
    } catch (e) {
      console.error(e);
    }

    // Settings listener for NEXUS branches
    try {
      const branchesRef = doc(db, 'settings', 'nexus_branches');
      unsubscribers.push(
        onSnapshot(
          branchesRef,
          (snap) => {
            if (snap.exists() && Array.isArray(snap.data()?.branches)) {
              setBranches(snap.data().branches as Branch[]);
            }
          },
          (err) => {
            console.error('Branches listener error:', err);
          }
        )
      );
    } catch (e) {
      console.error(e);
    }

    // Settings listener for NEXUS automations & logs
    try {
      const automationsRef = doc(db, 'settings', 'nexus_automations');
      unsubscribers.push(
        onSnapshot(
          automationsRef,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              if (Array.isArray(data?.rules)) {
                setAutomations(data.rules as AutomationRule[]);
              }
              if (Array.isArray(data?.logs)) {
                setAutomationLogs(data.logs as AutomationLog[]);
              }
            }
          },
          (err) => {
            console.error('Automations listener error:', err);
          }
        )
      );
    } catch (e) {
      console.error(e);
    }

    // Settings listener for NEXUS phoning campaigns
    try {
      const campRef = doc(db, 'settings', 'nexus_phoning_campaigns');
      unsubscribers.push(
        onSnapshot(
          campRef,
          (snap) => {
            if (snap.exists() && Array.isArray(snap.data()?.campaigns)) {
              setPhoningCampaigns(snap.data().campaigns as InternalPhoningCampaign[]);
            }
          },
          (err) => {
            console.error('Phoning campaigns listener error:', err);
          }
        )
      );
    } catch (e) {
      console.error(e);
    }

    return () => {
      unsubscribers.forEach((u) => u());
    };
  }, [user, isOwner]);

  // Prospects CRUD
  const createProspect = async (
    data: Omit<Prospect, 'id' | 'ownerId' | 'ownerEmail' | 'createdAt' | 'updatedAt' | 'isArchived'>
  ): Promise<string> => {
    if (!user || !user.email) throw new Error('Utilisateur non connecté');
    const id = genId('prospect');
    const now = new Date().toISOString();
    const docData: Prospect = {
      ...data,
      id,
      isArchived: false,
      ownerId: user.uid,
      ownerEmail: user.email,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await setDoc(doc(db, 'prospects', id), cleanDocumentData(docData));
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `prospects/${id}`);
    }
  };

  const updateProspect = async (id: string, data: Partial<Prospect>) => {
    if (!user) throw new Error('Utilisateur non connecté');
    try {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'prospects', id), cleanDocumentData({ ...data, updatedAt: now }), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `prospects/${id}`);
    }
  };

  const enrichProspect = async (id: string, data: EnrichedData) => {
    await updateProspect(id, {
      enrichedData: data,
      address: data.fullAddress || undefined,
      phone: data.verifiedPhone || undefined,
      verified: true,
      mapsUrl: data.googleMapsUrl || undefined,
    });
  };

  const toggleArchiveProspect = async (id: string, current: boolean) => {
    await updateProspect(id, { isArchived: !current });
  };

  const deleteProspect = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'prospects', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `prospects/${id}`);
    }
  };

  // Interactions
  const addInteraction = async (
    prospectId: string,
    data: Omit<Interaction, 'id' | 'prospectId' | 'ownerId' | 'createdAt'>
  ): Promise<string> => {
    if (!user) throw new Error('Utilisateur non connecté');
    const id = genId('inter');
    const now = new Date().toISOString();
    const item: Interaction = {
      ...data,
      id,
      prospectId,
      ownerId: user.uid,
      createdAt: now,
    };
    try {
      await setDoc(doc(db, 'prospects', prospectId, 'interactions', id), cleanDocumentData(item));
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `prospects/${prospectId}/interactions/${id}`);
    }
  };

  const getInteractions = async (prospectId: string): Promise<Interaction[]> => {
    try {
      const snap = await getDocs(collection(db, 'prospects', prospectId, 'interactions'));
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Interaction))
        .sort((a, b) => b.date.localeCompare(a.date));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `prospects/${prospectId}/interactions`);
    }
  };

  const deleteInteraction = async (prospectId: string, interactionId: string) => {
    try {
      await deleteDoc(doc(db, 'prospects', prospectId, 'interactions', interactionId));
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `prospects/${prospectId}/interactions/${interactionId}`
      );
    }
  };

  // Offers CRUD
  const createOffer = async (
    data: Omit<Offer, 'id' | 'ownerId' | 'ownerEmail' | 'createdAt' | 'updatedAt' | 'isArchived'>
  ): Promise<string> => {
    if (!user || !user.email) throw new Error('Utilisateur non connecté');
    const id = genId('offer');
    const now = new Date().toISOString();
    const docData: Offer = {
      ...data,
      id,
      isArchived: false,
      ownerId: user.uid,
      ownerEmail: user.email,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await setDoc(doc(db, 'offers', id), cleanDocumentData(docData));
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `offers/${id}`);
    }
  };

  const updateOffer = async (id: string, data: Partial<Offer>) => {
    try {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'offers', id), cleanDocumentData({ ...data, updatedAt: now }), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `offers/${id}`);
    }
  };

  const toggleArchiveOffer = async (id: string, current: boolean) => {
    await updateOffer(id, { isArchived: !current });
  };

  const deleteOffer = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'offers', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `offers/${id}`);
    }
  };

  // Projects CRUD
  const createProject = async (
    data: Omit<Project, 'id' | 'ownerId' | 'ownerEmail' | 'createdAt' | 'updatedAt' | 'isArchived'>
  ): Promise<string> => {
    if (!user || !user.email) throw new Error('Utilisateur non connecté');
    const id = genId('project');
    const now = new Date().toISOString();
    const docData: Project = {
      ...data,
      id,
      isArchived: false,
      ownerId: user.uid,
      ownerEmail: user.email,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await setDoc(doc(db, 'projects', id), cleanDocumentData(docData));
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `projects/${id}`);
    }
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
    try {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'projects', id), cleanDocumentData({ ...data, updatedAt: now }), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `projects/${id}`);
    }
  };

  const toggleArchiveProject = async (id: string, current: boolean) => {
    await updateProject(id, { isArchived: !current });
  };

  const deleteProject = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'projects', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `projects/${id}`);
    }
  };

  // Tasks CRUD
  const createTask = async (
    data: Omit<Task, 'id' | 'ownerId' | 'ownerEmail' | 'createdAt' | 'updatedAt' | 'isArchived'>
  ): Promise<string> => {
    if (!user || !user.email) throw new Error('Utilisateur non connecté');
    const id = genId('task');
    const now = new Date().toISOString();
    const docData: Task = {
      ...data,
      id,
      isArchived: false,
      ownerId: user.uid,
      ownerEmail: user.email,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await setDoc(doc(db, 'tasks', id), cleanDocumentData(docData));
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `tasks/${id}`);
    }
  };

  const updateTask = async (id: string, data: Partial<Task>) => {
    try {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'tasks', id), cleanDocumentData({ ...data, updatedAt: now }), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${id}`);
    }
  };

  const toggleTaskStatus = async (id: string, currentStatus: Task['status']) => {
    const nextStatus: Task['status'] = currentStatus === 'Terminé' ? 'À faire' : 'Terminé';
    await updateTask(id, { status: nextStatus });
  };

  const toggleArchiveTask = async (id: string, current: boolean) => {
    await updateTask(id, { isArchived: !current });
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `tasks/${id}`);
    }
  };

  // Ideas CRUD
  const createIdea = async (
    data: Omit<Idea, 'id' | 'ownerId' | 'ownerEmail' | 'createdAt' | 'updatedAt' | 'isArchived'>
  ): Promise<string> => {
    if (!user || !user.email) throw new Error('Utilisateur non connecté');
    const id = genId('idea');
    const now = new Date().toISOString();
    const docData: Idea = {
      ...data,
      id,
      isArchived: false,
      ownerId: user.uid,
      ownerEmail: user.email,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await setDoc(doc(db, 'ideas', id), cleanDocumentData(docData));
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `ideas/${id}`);
    }
  };

  const updateIdea = async (id: string, data: Partial<Idea>) => {
    try {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'ideas', id), cleanDocumentData({ ...data, updatedAt: now }), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `ideas/${id}`);
    }
  };

  const toggleArchiveIdea = async (id: string, current: boolean) => {
    await updateIdea(id, { isArchived: !current });
  };

  const deleteIdea = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'ideas', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `ideas/${id}`);
    }
  };

  // Decisions CRUD
  const createDecision = async (
    data: Omit<Decision, 'id' | 'ownerId' | 'ownerEmail' | 'createdAt' | 'updatedAt' | 'isArchived'>
  ): Promise<string> => {
    if (!user || !user.email) throw new Error('Utilisateur non connecté');
    const id = genId('decision');
    const now = new Date().toISOString();
    const docData: Decision = {
      ...data,
      id,
      isArchived: false,
      ownerId: user.uid,
      ownerEmail: user.email,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await setDoc(doc(db, 'decisions', id), cleanDocumentData(docData));
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `decisions/${id}`);
    }
  };

  const updateDecision = async (id: string, data: Partial<Decision>) => {
    try {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'decisions', id), cleanDocumentData({ ...data, updatedAt: now }), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `decisions/${id}`);
    }
  };

  const toggleArchiveDecision = async (id: string, current: boolean) => {
    await updateDecision(id, { isArchived: !current });
  };

  const deleteDecision = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'decisions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `decisions/${id}`);
    }
  };

  // Configurateur Web & Documents (NEXUS Digital)
  const updateCompanyLegal = async (profile: CompanyLegalProfile) => {
    if (!user || !user.email) throw new Error('Utilisateur non connecté');
    try {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'settings', 'nexus_digital_legal'), cleanDocumentData({
        ...profile,
        ownerEmail: user.email,
        updatedAt: now,
      }));
      setCompanyLegal(profile);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/nexus_digital_legal');
    }
  };

  const updateComponentsCatalog = async (catalog: WebComponent[]) => {
    if (!user || !user.email) throw new Error('Utilisateur non connecté');
    try {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'settings', 'web_components_catalog'), cleanDocumentData({
        components: catalog,
        ownerEmail: user.email,
        updatedAt: now,
      }));
      setComponentsCatalog(catalog);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/web_components_catalog');
    }
  };

  const saveProjectWebConfig = async (projectId: string, webConfig: WebConfiguration) => {
    await updateProject(projectId, { webConfig });
  };

  // --- Branches CRUD ---
  const saveBranchesToFirestore = async (newBranches: Branch[]) => {
    if (!user || !user.email) throw new Error('Utilisateur non connecté');
    try {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'settings', 'nexus_branches'), cleanDocumentData({
        branches: newBranches,
        ownerEmail: user.email,
        updatedAt: now,
      }));
      setBranches(newBranches);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/nexus_branches');
    }
  };

  const createBranch = async (
    data: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    const id = genId('branch');
    const now = new Date().toISOString();
    const newBranch: Branch = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      isCustom: true,
    };
    const updated = [...branches, newBranch];
    await saveBranchesToFirestore(updated);
    return id;
  };

  const updateBranch = async (id: string, data: Partial<Branch>) => {
    const now = new Date().toISOString();
    const updated = branches.map((b) => (b.id === id ? { ...b, ...data, updatedAt: now } : b));
    await saveBranchesToFirestore(updated);
  };

  const deleteBranch = async (id: string) => {
    const updated = branches.filter((b) => b.id !== id);
    await saveBranchesToFirestore(updated);
  };

  // --- Automations Center ---
  const saveAutomationsToFirestore = async (rules: AutomationRule[], logs?: AutomationLog[]) => {
    if (!user || !user.email) return;
    try {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'settings', 'nexus_automations'), cleanDocumentData({
        rules,
        logs: logs ?? automationLogs,
        ownerEmail: user.email,
        updatedAt: now,
      }));
      setAutomations(rules);
      if (logs) setAutomationLogs(logs);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/nexus_automations');
    }
  };

  const createAutomationRule = async (
    data: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>
  ): Promise<string> => {
    const id = genId('rule');
    const now = new Date().toISOString();
    // Safe by default: force initial status to 'brouillon' or 'en test'
    const initialStatus = data.status === 'active' ? 'en test' : data.status;
    const newRule: AutomationRule = {
      ...data,
      id,
      status: initialStatus,
      createdAt: now,
      updatedAt: now,
      executionCount: 0,
    };
    const updated = [...automations, newRule];
    await saveAutomationsToFirestore(updated);
    return id;
  };

  const updateAutomationRule = async (id: string, data: Partial<AutomationRule>) => {
    const now = new Date().toISOString();
    const updated = automations.map((r) => (r.id === id ? { ...r, ...data, updatedAt: now } : r));
    await saveAutomationsToFirestore(updated);
  };

  const deleteAutomationRule = async (id: string) => {
    const updated = automations.filter((r) => r.id !== id);
    await saveAutomationsToFirestore(updated);
  };

  const toggleAutomationRuleStatus = async (id: string, newStatus: AutomationStatus) => {
    await updateAutomationRule(id, { status: newStatus });
  };

  const emergencyStopAutomations = async () => {
    const now = new Date().toISOString();
    const paused = automations.map((r) => ({ ...r, status: 'en pause' as AutomationStatus, updatedAt: now }));
    const stopLog: AutomationLog = {
      id: genId('log'),
      ruleId: 'system_emergency_stop',
      ruleName: 'Arrêt d’urgence global',
      timestamp: now,
      status: 'avertissement',
      summary: 'Arrêt d’urgence déclenché : toutes les règles internes sont basculées en pause.',
    };
    const updatedLogs = [stopLog, ...automationLogs].slice(0, 100);
    await saveAutomationsToFirestore(paused, updatedLogs);
  };

  const runAutomationSimulation = (ruleId?: string): AutomationLog[] => {
    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];
    const rulesToSimulate = ruleId ? automations.filter((r) => r.id === ruleId) : automations;
    const simulationLogs: AutomationLog[] = [];

    for (const rule of rulesToSimulate) {
      if (rule.trigger === 'task_overdue') {
        const overdue = tasks.filter((t) => !t.isArchived && t.status !== 'Terminé' && t.dueDate && t.dueDate < todayStr);
        if (overdue.length > 0) {
          simulationLogs.push({
            id: genId('sim'),
            ruleId: rule.id,
            ruleName: rule.name,
            timestamp: now,
            status: 'simulé',
            summary: `Simulation : ${overdue.length} tâche(s) en retard détectée(s).`,
            details: overdue.map((t) => `« ${t.title} » (Échéance : ${t.dueDate})`).slice(0, 5).join(', '),
          });
        } else {
          simulationLogs.push({
            id: genId('sim'),
            ruleId: rule.id,
            ruleName: rule.name,
            timestamp: now,
            status: 'simulé',
            summary: 'Simulation : Aucune tâche en retard actuellement.',
          });
        }
      } else if (rule.trigger === 'prospect_won') {
        const wonWithoutProject = prospects.filter((p) => !p.isArchived && p.status === 'Gagné' && !projects.some((pr) => pr.prospectId === p.id));
        if (wonWithoutProject.length > 0) {
          simulationLogs.push({
            id: genId('sim'),
            ruleId: rule.id,
            ruleName: rule.name,
            timestamp: now,
            status: 'simulé',
            summary: `Simulation : ${wonWithoutProject.length} prospect(s) gagné(s) sans projet initialisé.`,
            details: wonWithoutProject.map((p) => p.company).join(', '),
          });
        } else {
          simulationLogs.push({
            id: genId('sim'),
            ruleId: rule.id,
            ruleName: rule.name,
            timestamp: now,
            status: 'simulé',
            summary: 'Simulation : Tous les prospects gagnés ont un projet associé ou aucun prospect gagné.',
          });
        }
      } else if (rule.trigger === 'period_end') {
        simulationLogs.push({
          id: genId('sim'),
          ruleId: rule.id,
          ruleName: rule.name,
          timestamp: now,
          status: 'simulé',
          summary: `Simulation de synthèse de période : ${projects.length} projet(s), ${tasks.length} action(s), ${prospects.length} prospect(s).`,
        });
      }
    }
    return simulationLogs;
  };

  const runAutomationsEvaluation = async (): Promise<AutomationLog[]> => {
    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];
    const newLogs: AutomationLog[] = [];
    const newAlerts: InAppAlert[] = [];

    const updatedRules = automations.map((rule) => {
      if (rule.status !== 'active' && rule.status !== 'en test') return rule;

      let lastRes = 'Aucune anomalie détectée';

      if (rule.trigger === 'task_overdue') {
        const overdue = tasks.filter((t) => !t.isArchived && t.status !== 'Terminé' && t.dueDate && t.dueDate < todayStr);
        if (overdue.length > 0) {
          lastRes = `${overdue.length} tâche(s) en retard identifiée(s)`;
          newLogs.push({
            id: genId('log'),
            ruleId: rule.id,
            ruleName: rule.name,
            timestamp: now,
            status: 'avertissement',
            summary: `Règle exécutée (${rule.status}) : ${overdue.length} tâche(s) en retard.`,
            details: overdue.map((t) => t.title).slice(0, 3).join(' ; '),
          });

          for (const t of overdue) {
            newAlerts.push({
              id: `alert_overdue_${t.id}_${todayStr}`,
              ruleId: rule.id,
              title: 'Échéance dépassée',
              message: `L'action « ${t.title} » devait être finalisée pour le ${t.dueDate}.`,
              severity: 'avertissement',
              entityType: 'tache',
              entityId: t.id,
              entityName: t.title,
              timestamp: now,
              dismissed: false,
            });
          }
        }
      } else if (rule.trigger === 'prospect_won') {
        const wonWithoutProject = prospects.filter((p) => !p.isArchived && p.status === 'Gagné' && !projects.some((pr) => pr.prospectId === p.id));
        if (wonWithoutProject.length > 0) {
          lastRes = `${wonWithoutProject.length} opportunité(s) gagnée(s) nécessitant cadrage`;
          newLogs.push({
            id: genId('log'),
            ruleId: rule.id,
            ruleName: rule.name,
            timestamp: now,
            status: 'succès',
            summary: `Règle exécutée (${rule.status}) : Proposition de checklist pour ${wonWithoutProject.length} opportunité(s) gagnée(s).`,
            details: wonWithoutProject.map((p) => p.company).join(', '),
          });

          for (const p of wonWithoutProject) {
            newAlerts.push({
              id: `alert_won_${p.id}`,
              ruleId: rule.id,
              title: 'Opportunité gagnée — Cadrage projet conseillé',
              message: `Le prospect « ${p.company} » est validé comme gagné. Souhaitez-vous initialiser le projet et les actions de cadrage ?`,
              severity: 'info',
              entityType: 'prospect',
              entityId: p.id,
              entityName: p.company,
              timestamp: now,
              dismissed: false,
            });
          }
        }
      } else if (rule.trigger === 'period_end') {
        lastRes = 'Brouillon de synthèse consolidée préparé';
        newLogs.push({
          id: genId('log'),
          ruleId: rule.id,
          ruleName: rule.name,
          timestamp: now,
          status: 'succès',
          summary: `Règle exécutée (${rule.status}) : Brouillon de rapport de synthèse consolidé prêt.`,
        });
      }

      return {
        ...rule,
        lastRunAt: now,
        lastResult: lastRes,
        executionCount: rule.executionCount + 1,
        updatedAt: now,
      };
    });

    setInAppAlerts((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));
      const fresh = newAlerts.filter((a) => !existingIds.has(a.id));
      return [...fresh, ...prev].slice(0, 50);
    });

    const combinedLogs = [...newLogs, ...automationLogs].slice(0, 100);
    await saveAutomationsToFirestore(updatedRules, combinedLogs);
    return newLogs;
  };

  const dismissAlert = (alertId: string) => {
    setInAppAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, dismissed: true } : a)));
  };

  const clearDismissedAlerts = () => {
    setInAppAlerts((prev) => prev.filter((a) => !a.dismissed));
  };

  // Prospection Téléphonique Interne CRUD & Call Logging
  const savePhoningCampaign = async (campaign: InternalPhoningCampaign) => {
    if (!user || !user.email) throw new Error('Utilisateur non connecté');
    const existingIdx = phoningCampaigns.findIndex((c) => c.id === campaign.id);
    let updated: InternalPhoningCampaign[];
    const now = new Date().toISOString();
    const cleanCamp = { ...campaign, updatedAt: now };
    if (existingIdx >= 0) {
      updated = phoningCampaigns.map((c) => (c.id === campaign.id ? cleanCamp : c));
    } else {
      updated = [...phoningCampaigns, { ...cleanCamp, createdAt: now }];
    }
    setPhoningCampaigns(updated);
    try {
      await setDoc(
        doc(db, 'settings', 'nexus_phoning_campaigns'),
        cleanDocumentData({
          ownerEmail: user.email,
          campaigns: updated,
          updatedAt: now,
        })
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/nexus_phoning_campaigns');
    }
  };

  const deletePhoningCampaign = async (id: string) => {
    if (!user || !user.email) throw new Error('Utilisateur non connecté');
    const updated = phoningCampaigns.filter((c) => c.id !== id);
    setPhoningCampaigns(updated);
    const now = new Date().toISOString();
    try {
      await setDoc(
        doc(db, 'settings', 'nexus_phoning_campaigns'),
        cleanDocumentData({
          ownerEmail: user.email,
          campaigns: updated,
          updatedAt: now,
        })
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/nexus_phoning_campaigns');
    }
  };

  const logPhoningCall = async (params: {
    prospectId: string;
    result: CallResult;
    notes: string;
    nextStep?: string;
    nextContactDate?: string;
    newProspectStatus?: ProspectStatus;
    campaignId?: string;
    campaignName?: string;
    branchId?: string;
    objectionMetId?: string;
    objectionMetTitle?: string;
    durationMinutes?: number;
    createReminderTask?: boolean;
    reminderTaskDueDate?: string;
    reminderTaskPriority?: TaskPriority;
  }): Promise<{ interactionId: string; taskId?: string }> => {
    if (!user || !user.email) throw new Error('Utilisateur non connecté');

    const prospect = prospects.find((p) => p.id === params.prospectId);
    if (!prospect) throw new Error('Prospect introuvable');

    const now = new Date().toISOString();
    const todayDate = now.split('T')[0];

    // Summary must be between 1 and 2000 chars as enforced by firestore.rules
    const summary = `Appel de prospection [${params.result}]${
      params.campaignName ? ` · Campagne : ${params.campaignName}` : ''
    }${params.objectionMetTitle ? ` · Objection : ${params.objectionMetTitle}` : ''}${
      params.notes ? `\nNotes : ${params.notes}` : ''
    }`;
    const cleanSummary = summary.slice(0, 1990);

    const interId = genId('inter');
    const interactionDoc: Interaction = {
      id: interId,
      prospectId: params.prospectId,
      date: todayDate,
      type: 'Appel',
      summary: cleanSummary,
      nextStep: params.nextStep || '',
      callResult: params.result,
      campaignId: params.campaignId || '',
      campaignName: params.campaignName || '',
      branchId: params.branchId || prospect.branchId || '',
      objectionMet: params.objectionMetTitle || '',
      durationMinutes: params.durationMinutes || 0,
      ownerId: user.uid,
      createdAt: now,
    };

    try {
      // 1. Write interaction document to Firestore
      await setDoc(
        doc(db, 'prospects', params.prospectId, 'interactions', interId),
        cleanDocumentData(interactionDoc)
      );

      // Update cached interactions in local state
      setLoadedInteractions((prev) => {
        const existing = prev[params.prospectId] || [];
        return {
          ...prev,
          [params.prospectId]: [interactionDoc, ...existing],
        };
      });

      // 2. Update prospect with new status & nextContactDate
      const prospectUpdates: Partial<Prospect> = {
        updatedAt: now,
      };
      if (params.newProspectStatus) {
        prospectUpdates.status = params.newProspectStatus;
      }
      if (params.nextContactDate !== undefined) {
        prospectUpdates.nextContactDate = params.nextContactDate;
      }
      if (params.branchId && !prospect.branchId) {
        prospectUpdates.branchId = params.branchId;
      }
      await updateProspect(params.prospectId, prospectUpdates);

      // 3. Optional reminder task (created ONLY if user validated in form)
      let createdTaskId: string | undefined;
      if (params.createReminderTask && params.reminderTaskDueDate) {
        const taskTitle = `Relance prospect : ${prospect.company} (${params.result})`;
        const taskDesc = `Campagne : ${params.campaignName || 'Interne'}\nNotes d’appel : ${
          params.notes || 'Aucune'
        }\nAction convenue : ${params.nextStep || 'Relance planifiée'}`;
        createdTaskId = await createTask({
          title: taskTitle.slice(0, 240),
          dueDate: params.reminderTaskDueDate,
          priority: params.reminderTaskPriority || 'Moyenne',
          status: 'À faire',
          branchId: params.branchId || prospect.branchId || '',
          prospectId: prospect.id,
          prospectName: prospect.company,
          description: taskDesc,
        });
      }

      return { interactionId: interId, taskId: createdTaskId };
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `prospects/${params.prospectId}/interactions/${interId}`
      );
      throw err;
    }
  };

  const fetchInteractionsForProspects = async (prospectIds: string[]): Promise<Interaction[]> => {
    const results: Interaction[] = [];
    const newLoadedMap = { ...loadedInteractions };
    for (const pId of prospectIds) {
      try {
        const items = await getInteractions(pId);
        newLoadedMap[pId] = items;
        results.push(...items);
      } catch (e) {
        console.error('Failed to load interactions for prospect:', pId, e);
      }
    }
    setLoadedInteractions(newLoadedMap);
    return results;
  };

  // Clean all fake / test data from Firestore
  const cleanFakeData = async (): Promise<{ deletedProspects: number; deletedCampaigns: number }> => {
    let deletedProspects = 0;
    for (const p of prospects) {
      if (
        p.company.includes('(Fictif)') ||
        p.company.includes('Fictif') ||
        p.contactName.includes('(Fictif)') ||
        p.notes?.includes('Fictif')
      ) {
        await deleteProspect(p.id);
        deletedProspects++;
      }
    }

    // Clean hardcoded legacy mock campaign templates from settings document if present
    const remainingCampaigns = phoningCampaigns.filter(
      (c) =>
        c.id !== 'camp_consulting_audit' &&
        c.id !== 'camp_digital_configurator' &&
        c.id !== 'camp_academy_formation' &&
        c.id !== 'camp_qvt_ergonomie'
    );
    const deletedCampaigns = phoningCampaigns.length - remainingCampaigns.length;
    if (deletedCampaigns > 0) {
      setPhoningCampaigns(remainingCampaigns);
      if (user?.email) {
        try {
          await setDoc(
            doc(db, 'settings', 'nexus_phoning_campaigns'),
            cleanDocumentData({
              ownerEmail: user.email,
              campaigns: remainingCampaigns,
              updatedAt: new Date().toISOString(),
            })
          );
        } catch (e) {
          console.error('Failed to update campaigns settings:', e);
        }
      }
    }

    return { deletedProspects, deletedCampaigns };
  };

  // Deprecated: seedFictionalData is now disabled to strictly satisfy the zero-fake-data policy
  const seedFictionalData = async () => {
    console.info('seedFictionalData is disabled to ensure 100% real operations.');
  };

  // Clear all data
  const clearAllData = async () => {
    for (const p of prospects) await deleteProspect(p.id);
    for (const o of offers) await deleteOffer(o.id);
    for (const pr of projects) await deleteProject(pr.id);
    for (const t of tasks) await deleteTask(t.id);
    for (const i of ideas) await deleteIdea(i.id);
    for (const d of decisions) await deleteDecision(d.id);
  };

  // Computed KPIs based strictly on persisted data
  const kpis = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    const activeP = prospects.filter((p) => !p.isArchived);
    const proposalsSent = activeP.filter((p) => p.status === 'Proposition envoyée').length;
    const wonProspects = activeP.filter((p) => p.status === 'Gagné').length;

    const activePr = projects.filter((p) => !p.isArchived);
    const inProgressProjects = activePr.filter((p) => p.status === 'En cours').length;
    const blockedProjects = activePr.filter((p) => p.status === 'Bloqué').length;
    const deliveredProjects = activePr.filter((p) => p.status === 'Livré').length;

    const activeTasks = tasks.filter((t) => !t.isArchived);
    const nonCompleted = activeTasks.filter((t) => t.status !== 'Terminé');

    // "À faire aujourd'hui" = Non terminé et échéance <= aujourd'hui
    const todayTasks = nonCompleted.filter((t) => t.dueDate && t.dueDate <= todayStr);
    const overdueTasksCount = nonCompleted.filter((t) => t.dueDate && t.dueDate < todayStr).length;

    // "Prochaines actions" = Non terminé et échéance > aujourd'hui, trié par échéance
    const upcomingTasks = nonCompleted
      .filter((t) => !t.dueDate || t.dueDate > todayStr)
      .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));

    const activeOffersCount = offers.filter((o) => !o.isArchived && (o.status === 'Actif' || o.status === 'Prêt à vendre')).length;
    const totalDecisionsCount = decisions.filter((d) => !d.isArchived && d.status === 'Actée').length;

    return {
      activeProspects: activeP.length,
      proposalsSent,
      wonProspects,
      activeProjects: inProgressProjects,
      blockedProjects,
      deliveredProjects,
      todayTasks,
      upcomingTasks,
      overdueTasksCount,
      activeOffersCount,
      totalDecisionsCount,
    };
  }, [prospects, projects, tasks, offers, decisions]);

  // Exporters (CSV & JSON)
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toCSV = (rows: Record<string, unknown>[]): string => {
    if (rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const escapeVal = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };
    const csvRows = [
      headers.join(';'),
      ...rows.map((row) => headers.map((header) => escapeVal(row[header])).join(';')),
    ];
    return '\uFEFF' + csvRows.join('\r\n');
  };

  const exportToCSV = (entityName: 'prospects' | 'offers' | 'projects' | 'tasks' | 'all') => {
    const dateStr = new Date().toISOString().split('T')[0];
    if (entityName === 'prospects') {
      const rows = prospects.map((p) => ({
        ID: p.id,
        Entreprise: p.company,
        Contact: p.contactName,
        Email: p.email,
        Telephone: p.phone,
        Secteur: p.sector,
        Statut: p.status,
        ProchainContact: p.nextContactDate || '',
        Besoins: p.needsSummary,
        Notes: p.notes,
        Archive: p.isArchived ? 'Oui' : 'Non',
        CreeLe: p.createdAt,
      }));
      downloadFile(toCSV(rows), `nexus_prospects_${dateStr}.csv`, 'text/csv;charset=utf-8;');
    } else if (entityName === 'offers') {
      const rows = offers.map((o) => ({
        ID: o.id,
        Nom: o.name,
        Code: o.code,
        Cible: o.targetAudience,
        Statut: o.status,
        ValeurMetier: o.businessValue,
        Livrables: o.deliverables,
        Archive: o.isArchived ? 'Oui' : 'Non',
        CreeLe: o.createdAt,
      }));
      downloadFile(toCSV(rows), `nexus_offres_${dateStr}.csv`, 'text/csv;charset=utf-8;');
    } else if (entityName === 'projects') {
      const rows = projects.map((pr) => ({
        ID: pr.id,
        Titre: pr.title,
        OffreId: pr.offerId || '',
        OffreNom: pr.offerName || '',
        Client: pr.clientName || '',
        Statut: pr.status,
        ObjectifBusiness: pr.businessObjective,
        Perimetre: pr.scope,
        DateDebut: pr.startDate || '',
        DateEcheance: pr.targetDate || '',
        Notes: pr.notes,
        Archive: pr.isArchived ? 'Oui' : 'Non',
      }));
      downloadFile(toCSV(rows), `nexus_projets_${dateStr}.csv`, 'text/csv;charset=utf-8;');
    } else if (entityName === 'tasks') {
      const rows = tasks.map((t) => ({
        ID: t.id,
        Titre: t.title,
        Priorite: t.priority,
        Statut: t.status,
        Echeance: t.dueDate,
        Projet: t.projectTitle || '',
        Prospect: t.prospectName || '',
        Description: t.description,
        Archive: t.isArchived ? 'Oui' : 'Non',
      }));
      downloadFile(toCSV(rows), `nexus_actions_${dateStr}.csv`, 'text/csv;charset=utf-8;');
    } else if (entityName === 'all') {
      // Export all as combined CSV files
      exportToCSV('prospects');
      exportToCSV('offers');
      exportToCSV('projects');
      exportToCSV('tasks');
    }
  };

  const exportToJSON = (entityName: 'prospects' | 'offers' | 'projects' | 'tasks' | 'all') => {
    const dateStr = new Date().toISOString().split('T')[0];
    let payload: unknown = {};
    if (entityName === 'prospects') payload = prospects;
    else if (entityName === 'offers') payload = offers;
    else if (entityName === 'projects') payload = projects;
    else if (entityName === 'tasks') payload = tasks;
    else if (entityName === 'all') {
      payload = {
        meta: {
          app: 'NEXUS OS',
          exportedAt: new Date().toISOString(),
          ownerEmail: user?.email,
          motto: 'THINK HUMAN, EXECUTE AI, EVOLVE HYBRID.',
          principle: 'L’entreprise d’abord. La technologie ensuite.',
        },
        prospects,
        offers,
        projects,
        tasks,
        ideas,
        decisions,
      };
    }
    const jsonStr = JSON.stringify(payload, null, 2);
    downloadFile(jsonStr, `nexus_${entityName}_${dateStr}.json`, 'application/json');
  };

  return (
    <DataContext.Provider
      value={{
        prospects,
        offers,
        projects,
        tasks,
        ideas,
        decisions,
        loading,
        error,
        createProspect,
        updateProspect,
        enrichProspect,
        toggleArchiveProspect,
        deleteProspect,
        addInteraction,
        getInteractions,
        deleteInteraction,
        createOffer,
        updateOffer,
        toggleArchiveOffer,
        deleteOffer,
        createProject,
        updateProject,
        toggleArchiveProject,
        deleteProject,
        createTask,
        updateTask,
        toggleTaskStatus,
        toggleArchiveTask,
        deleteTask,
        createIdea,
        updateIdea,
        toggleArchiveIdea,
        deleteIdea,
        createDecision,
        updateDecision,
        toggleArchiveDecision,
        deleteDecision,
        cleanFakeData,
        seedFictionalData,
        clearAllData,
        kpis,
        exportToCSV,
        exportToJSON,
        companyLegal,
        updateCompanyLegal,
        componentsCatalog,
        updateComponentsCatalog,
        saveProjectWebConfig,
        branches,
        createBranch,
        updateBranch,
        deleteBranch,
        automations,
        automationLogs,
        inAppAlerts,
        createAutomationRule,
        updateAutomationRule,
        deleteAutomationRule,
        toggleAutomationRuleStatus,
        emergencyStopAutomations,
        runAutomationSimulation,
        runAutomationsEvaluation,
        dismissAlert,
        clearDismissedAlerts,
        phoningCampaigns,
        savePhoningCampaign,
        deletePhoningCampaign,
        logPhoningCall,
        loadedInteractions,
        fetchInteractionsForProspects,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
