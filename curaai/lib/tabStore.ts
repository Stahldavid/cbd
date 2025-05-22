import { create } from 'zustand';

interface TabState {
  activeTab: string; // e.g., 'chat', 'prescription', 'patientInfo'
  setActiveTab: (tabId: string) => void;
}

export const useTabStore = create<TabState>((set) => ({
  activeTab: 'chat', // Default tab can be 'chat' or whatever your initial tab is
  setActiveTab: (tabId) => set({ activeTab: tabId }),
})); 
 