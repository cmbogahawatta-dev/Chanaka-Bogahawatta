import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Building2,
  Briefcase,
  FileText,
  Plus,
  Layers,
  Search,
  FolderTree,
  Landmark
} from 'lucide-react';
import { ClientFolder } from '../../utils/correspondenceUtils';
import { useEnterpriseBanking } from '../../context/EnterpriseBankingContext';

interface CorrespondenceFolderTreeProps {
  clientFolders: ClientFolder[];
  generalLettersCount: number;
  totalLettersCount: number;
  selectedClientKey: string | null;
  selectedProjectKey: string | null;
  onSelectFolder: (clientKey: string | null, projectKey: string | null) => void;
  onCreateInFolder?: (params: {
    clientAffix?: string;
    clientName?: string;
    projectAffix?: string;
    projectCode?: string;
    projectName?: string;
  }) => void;
}

export const CorrespondenceFolderTree: React.FC<CorrespondenceFolderTreeProps> = ({
  clientFolders,
  generalLettersCount,
  totalLettersCount,
  selectedClientKey,
  selectedProjectKey,
  onSelectFolder,
  onCreateInFolder
}) => {
  const { registeredBanks } = useEnterpriseBanking();

  // Set all folders open by default
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    clientFolders.forEach(c => {
      init[c.clientKey] = true;
    });
    return init;
  });

  const [folderSearch, setFolderSearch] = useState('');

  const toggleClientExpand = (clientKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedClients(prev => ({
      ...prev,
      [clientKey]: !prev[clientKey]
    }));
  };

  const filteredClientFolders = clientFolders.filter(c => {
    if (!folderSearch.trim()) return true;
    const term = folderSearch.toLowerCase();
    const matchClient =
      c.clientName.toLowerCase().includes(term) ||
      c.clientAffix.toLowerCase().includes(term);
    const matchProject = c.projects.some(
      p =>
        p.projectCode.toLowerCase().includes(term) ||
        p.projectName.toLowerCase().includes(term) ||
        p.projectAffix.toLowerCase().includes(term)
    );
    return matchClient || matchProject;
  });

  const isAllSelected = selectedClientKey === null && selectedProjectKey === null;
  const isGeneralSelected = selectedClientKey === 'GENERAL';

  return (
    <div className="flex flex-col h-full bg-slate-900/80 border-r border-slate-800 w-80 select-none">
      {/* Folder Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-200">
          <FolderTree className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Client & Project Folders
          </span>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-semibold border border-purple-500/20">
          {totalLettersCount} Total
        </span>
      </div>

      {/* Quick Search */}
      <div className="p-2.5 border-b border-slate-800/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search folders & projects..."
            value={folderSearch}
            onChange={e => setFolderSearch(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Folder Tree Scrollable List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
        {/* Root: All Folders */}
        <div
          onClick={() => onSelectFolder(null, null)}
          className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
            isAllSelected
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <Layers className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span className="truncate">All Correspondence Folders</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            {totalLettersCount}
          </span>
        </div>

        {/* Client Folders Divider */}
        <div className="pt-2 pb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
          <span>Client Registries ({filteredClientFolders.length})</span>
        </div>

        {/* Client Folders Loop */}
        {filteredClientFolders.map(client => {
          const isClientOpen = expandedClients[client.clientKey] !== false;
          const isClientSelected =
            selectedClientKey === client.clientKey && selectedProjectKey === null;

          const isBankFolder = registeredBanks.some(
            b =>
              (b.shortName && b.shortName.toUpperCase() === client.clientAffix?.toUpperCase()) ||
              b.bankName.toLowerCase() === client.clientName.toLowerCase() ||
              client.clientName.toLowerCase().includes('bank')
          );

          return (
            <div key={client.clientKey} className="space-y-0.5">
              {/* Client / Bank Folder Row */}
              <div
                onClick={() => onSelectFolder(client.clientKey, null)}
                className={`group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  isClientSelected
                    ? isBankFolder
                      ? 'bg-emerald-600/20 text-emerald-200 border border-emerald-500/30 font-semibold'
                      : 'bg-purple-600/20 text-purple-200 border border-purple-500/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <button
                    onClick={e => toggleClientExpand(client.clientKey, e)}
                    className="p-0.5 text-slate-400 hover:text-slate-200"
                  >
                    {isClientOpen ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {isBankFolder ? (
                    <Landmark className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : isClientOpen ? (
                    <FolderOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  ) : (
                    <Folder className="w-4 h-4 text-amber-500/80 flex-shrink-0" />
                  )}
                  <span className="truncate font-medium">{client.clientName}</span>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      isBankFolder
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {client.clientAffix}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {client.totalLetters}
                  </span>
                </div>
              </div>

              {/* Project Subfolders (Indented) */}
              {isClientOpen && (
                <div className="ml-5 pl-2 border-l border-slate-800/80 space-y-0.5 my-0.5">
                  {client.projects.map(proj => {
                    const isProjSelected = selectedProjectKey === proj.projectKey;

                    return (
                      <div
                        key={proj.projectKey}
                        onClick={() => onSelectFolder(client.clientKey, proj.projectKey)}
                        className={`group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                          isProjSelected
                            ? 'bg-emerald-600/20 text-emerald-200 border border-emerald-500/30 font-semibold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Briefcase className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <div className="truncate">
                            <span className="font-mono text-[11px] text-emerald-400 mr-1 font-bold">
                              {proj.projectAffix}
                            </span>
                            <span className="truncate">{proj.projectName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {onCreateInFolder && (
                            <button
                              title={`Create letter in ${proj.projectAffix}`}
                              onClick={e => {
                                e.stopPropagation();
                                onCreateInFolder({
                                  clientAffix: client.clientAffix,
                                  clientName: client.clientName,
                                  projectAffix: proj.projectAffix,
                                  projectCode: proj.projectCode,
                                  projectName: proj.projectName
                                });
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-emerald-500/20 text-emerald-400 rounded transition-opacity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            {proj.letters.length}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Create New Letter in Client */}
                  {onCreateInFolder && (
                    <button
                      onClick={() =>
                        onCreateInFolder({
                          clientAffix: client.clientAffix,
                          clientName: client.clientName
                        })
                      }
                      className="w-full flex items-center gap-1.5 px-2 py-1 text-[11px] text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Letter for {client.clientAffix}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* General / Corporate Correspondence Folder */}
        <div className="pt-2 pb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Corporate & Statutory
        </div>
        <div
          onClick={() => onSelectFolder('GENERAL', null)}
          className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
            isGeneralSelected
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="truncate">General Corporate & Statutory</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            {generalLettersCount}
          </span>
        </div>
      </div>
    </div>
  );
};
