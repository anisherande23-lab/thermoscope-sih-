import React, { useState } from 'react';
import { ThermalEvent, Facility, FilterOptions, ReviewStatus } from '../types';
import { ThermalMap } from '../components/ThermalMap';
import { FilterPanel } from '../components/FilterPanel';
import { EventDetailsPanel } from '../components/EventDetailsPanel';

interface ThermalMapPageProps {
  events: ThermalEvent[];
  facilities: Facility[];
  selectedEvent: ThermalEvent | null;
  onSelectEvent: (event: ThermalEvent | null) => void;
  selectedFacility: Facility | null;
  onSelectFacility: (facility: Facility | null) => void;
  filters: FilterOptions;
  onFilterChange: (newFilters: FilterOptions) => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
  onVerifyEvent: (eventId: string, status: ReviewStatus, notes?: string) => Promise<void>;
}

export const ThermalMapPage: React.FC<ThermalMapPageProps> = ({
  events,
  facilities,
  selectedEvent,
  onSelectEvent,
  selectedFacility,
  onSelectFacility,
  filters,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
  onVerifyEvent,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  const matchedFacility = facilities.find((f) => f.id === selectedEvent?.facilityId) || null;
  const facilityHistory = matchedFacility?.historicalThermalHistory || [];

  return (
    <div className="relative flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-950">
      {/* Left Filter Panel (Collapsible) */}
      <FilterPanel
        filters={filters}
        onFilterChange={onFilterChange}
        onResetFilters={onResetFilters}
        totalCount={totalCount}
        filteredCount={filteredCount}
        isOpen={isFilterOpen}
        onToggleOpen={() => setIsFilterOpen(!isFilterOpen)}
      />

      {/* Center GIS Interactive Map */}
      <div className="relative flex-1 h-full w-full">
        <ThermalMap
          events={events}
          facilities={facilities}
          selectedEvent={selectedEvent}
          onSelectEvent={(evt) => onSelectEvent(evt)}
          selectedFacility={selectedFacility}
          onSelectFacility={(fac) => onSelectFacility(fac)}
        />
      </div>

      {/* Right Slide-over Event Inspection Drawer */}
      {selectedEvent && (
        <div className="absolute right-0 top-0 bottom-0 z-30 flex h-full">
          <EventDetailsPanel
            event={selectedEvent}
            facility={matchedFacility}
            onClose={() => onSelectEvent(null)}
            onVerify={onVerifyEvent}
            facilityThermalHistory={facilityHistory}
          />
        </div>
      )}
    </div>
  );
};
