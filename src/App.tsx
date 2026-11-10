import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { CockpitView } from './components/cockpit/CockpitView';
import { ProspectsView } from './components/prospects/ProspectsView';
import { OffersView } from './components/offers/OffersView';
import { ProjectsView } from './components/projects/ProjectsView';
import { TasksView } from './components/tasks/TasksView';
import { BranchesAndReportsView } from './components/branches/BranchesAndReportsView';
import { WorkflowEngineView } from './components/workflow/WorkflowEngineView';
import { ConfiguratorView } from './components/configurator/ConfiguratorView';
import { IdeasDecisionsView } from './components/ideas/IdeasDecisionsView';
import { SettingsView } from './components/settings/SettingsView';
import { CallDeskView } from './components/call-desk/CallDeskView';
import { NexusDataAcquisitionView } from './components/acquisition/NexusDataAcquisitionView';
import { NexusFieldView } from './components/field/NexusFieldView';
import { EmailProspectingView } from './components/email/EmailProspectingView';
import { CampaignsView } from './components/campaigns/CampaignsView';
import { ExecutiveCockpitView } from './components/cockpit/ExecutiveCockpitView';
import { Modal } from './components/ui/Modal';
import { TASK_PRIORITIES, TASK_STATUSES, type ActiveSection, type TaskPriority, type TaskStatus } from './types/nexus';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { NexusLogo } from './components/brand/NexusLogo';

const MainApp: React.FC = () => {
  const { user, isOwner, loading: authLoading } = useAuth();
  const [currentSection, setCurrentSection] = useState<ActiveSection>('cockpit');
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Quick Task Creation Modal
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDueDate, setQuickDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickPriority, setQuickPriority] = useState<TaskPriority>('Moyenne');
  const [quickProjectId, setQuickProjectId] = useState('');
  const [quickProspectId, setQuickProspectId] = useState('');
  const [quickDesc, setQuickDesc] = useState('');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-neutral-100 p-4">
        <NexusLogo variant="large" showSubtext={true} className="mb-6 animate-pulse" />
        <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          <span>Initialisation sécurisée du cockpit NEXUS OS...</span>
        </div>
      </div>
    );
  }

  // If not authenticated or not the verified owner
  if (!user || !isOwner) {
    return <AuthScreen />;
  }

  return (
    <DataProvider>
      <AppContent
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        isOpenMobile={isOpenMobile}
        onToggleMobile={() => setIsOpenMobile((v) => !v)}
        onOpenQuickTask={() => setIsQuickTaskOpen(true)}
      />

      {/* Global Quick Task Modal */}
      <QuickTaskModalWrapper
        isOpen={isQuickTaskOpen}
        onClose={() => setIsQuickTaskOpen(false)}
        title={quickTitle}
        setTitle={setQuickTitle}
        dueDate={quickDueDate}
        setDueDate={setQuickDueDate}
        priority={quickPriority}
        setPriority={setQuickPriority}
        projectId={quickProjectId}
        setProjectId={setQuickProjectId}
        prospectId={quickProspectId}
        setProspectId={setQuickProspectId}
        description={quickDesc}
        setDescription={setQuickDesc}
      />
    </DataProvider>
  );
};

const AppContent: React.FC<{
  currentSection: ActiveSection;
  onSelectSection: (s: ActiveSection) => void;
  isOpenMobile: boolean;
  onToggleMobile: () => void;
  onOpenQuickTask: () => void;
}> = ({
  currentSection,
  onSelectSection,
  isOpenMobile,
  onToggleMobile,
  onOpenQuickTask,
}) => {
  const { error } = useData();
  const [selectedPhoningCampaignId, setSelectedPhoningCampaignId] = useState<string | undefined>(undefined);

  const quickActionLabels: Record<ActiveSection, string | undefined> = {
    cockpit: 'Nouvelle Action',
    campaigns: undefined,
    acquisition: undefined,
    prospects: undefined,
    phoning: undefined,
    field: undefined,
    email: undefined,
    offers: undefined,
    projects: undefined,
    tasks: 'Nouvelle Action',
    branches_reports: undefined,
    automations: undefined,
    configurator: undefined,
    ideas_decisions: undefined,
    settings: undefined,
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={onSelectSection}
        isOpenMobile={isOpenMobile}
        onToggleMobile={onToggleMobile}
      />

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1 min-h-screen">
        <Header
          currentSection={currentSection}
          onOpenMobileSidebar={onToggleMobile}
          onQuickAction={onOpenQuickTask}
          quickActionLabel={quickActionLabels[currentSection]}
        />

        {/* Global Error Banner */}
        {error && (
          <div className="bg-red-950/80 border-b border-red-900/80 px-4 py-2.5 text-xs text-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Erreur Firestore : {error}</span>
            </div>
          </div>
        )}

        {/* Viewport View */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {currentSection === 'cockpit' && (
            <ExecutiveCockpitView onNavigateToSection={(s) => onSelectSection(s as ActiveSection)} />
          )}
          {currentSection === 'campaigns' && (
            <CampaignsView
              onNavigate={onSelectSection}
              onSelectCampaignForPhoning={(campaignId) => {
                setSelectedPhoningCampaignId(campaignId);
                onSelectSection('phoning');
              }}
            />
          )}
          {currentSection === 'acquisition' && (
            <NexusDataAcquisitionView
              onNavigateToPhoning={() => onSelectSection('phoning')}
              onNavigateToCrm={() => onSelectSection('prospects')}
            />
          )}
          {currentSection === 'prospects' && (
            <ProspectsView onNavigate={onSelectSection} />
          )}
          {currentSection === 'phoning' && (
            <CallDeskView
              initialCampaignId={selectedPhoningCampaignId}
              onNavigateToCockpit={() => onSelectSection('cockpit')}
            />
          )}
          {currentSection === 'field' && <NexusFieldView />}
          {currentSection === 'email' && <EmailProspectingView />}
          {currentSection === 'offers' && <OffersView />}
          {currentSection === 'projects' && <ProjectsView />}
          {currentSection === 'tasks' && <TasksView />}
          {currentSection === 'branches_reports' && (
            <BranchesAndReportsView onNavigate={onSelectSection} />
          )}
          {currentSection === 'automations' && <WorkflowEngineView />}
          {currentSection === 'configurator' && <ConfiguratorView />}
          {currentSection === 'ideas_decisions' && <IdeasDecisionsView />}
          {currentSection === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

const QuickTaskModalWrapper: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  setTitle: (s: string) => void;
  dueDate: string;
  setDueDate: (s: string) => void;
  priority: TaskPriority;
  setPriority: (p: TaskPriority) => void;
  projectId: string;
  setProjectId: (s: string) => void;
  prospectId: string;
  setProspectId: (s: string) => void;
  description: string;
  setDescription: (s: string) => void;
}> = (props) => {
  const { createTask, projects, prospects, branches } = useData();
  const [branchId, setBranchId] = useState('');
  const [formErr, setFormErr] = useState<string | null>(null);

  if (!props.isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr(null);
    if (!props.title.trim()) {
      setFormErr("Le titre de l'action est obligatoire.");
      return;
    }

    const selProj = projects.find((p) => p.id === props.projectId);
    const selProspect = prospects.find((p) => p.id === props.prospectId);

    try {
      const taskData: Parameters<typeof createTask>[0] = {
        title: props.title.trim(),
        dueDate: props.dueDate || '',
        priority: props.priority,
        status: 'À faire',
        description: props.description.trim(),
      };
      if (branchId) {
        taskData.branchId = branchId;
      }
      if (props.projectId && selProj) {
        taskData.projectId = props.projectId;
        taskData.projectTitle = selProj.title;
      }
      if (props.prospectId && selProspect) {
        taskData.prospectId = props.prospectId;
        taskData.prospectName = selProspect.company;
      }
      await createTask(taskData);
      props.setTitle('');
      props.setDescription('');
      setBranchId('');
      props.onClose();
    } catch (err: unknown) {
      setFormErr(err instanceof Error ? err.message : 'Erreur');
    }
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Créer une action rapide"
      subtitle="Ajout direct dans la liste des actions prioritaires"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formErr && (
          <div className="p-3 bg-red-950/60 border border-red-900 text-red-300 text-xs rounded-lg">
            {formErr}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            Titre de l'action <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            autoFocus
            value={props.title}
            onChange={(e) => props.setTitle(e.target.value)}
            placeholder="Ex: Soutenir la proposition de cadrage"
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Date d'échéance
            </label>
            <input
              type="date"
              value={props.dueDate}
              onChange={(e) => props.setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Priorité</label>
            <select
              value={props.priority}
              onChange={(e) => props.setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
            >
              {TASK_PRIORITIES.map((pr) => (
                <option key={pr} value={pr}>
                  Priorité {pr}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Projet relié (optionnel)
            </label>
            <select
              value={props.projectId}
              onChange={(e) => props.setProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
            >
              <option value="">Aucun</option>
              {projects.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Prospect relié (optionnel)
            </label>
            <select
              value={props.prospectId}
              onChange={(e) => props.setProspectId(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
            >
              <option value="">Aucun</option>
              {prospects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.company}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            Branche NEXUS (optionnel)
          </label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
          >
            <option value="">Transversale / Non assignée</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">Notes / Contexte</label>
          <textarea
            rows={2}
            value={props.description}
            onChange={(e) => props.setDescription(e.target.value)}
            placeholder="Détails..."
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
          />
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-800">
          <button
            type="button"
            onClick={props.onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-950 rounded-lg text-xs font-medium transition-colors shadow-xs"
          >
            Créer l'action
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
