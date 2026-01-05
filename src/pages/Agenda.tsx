import { useState, useMemo } from "react";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CalendarHeader, type CalendarViewType } from "@/components/agenda/CalendarHeader";
import { CalendarWeekView } from "@/components/agenda/CalendarWeekView";
import { CalendarDayView } from "@/components/agenda/CalendarDayView";
import { CalendarMonthView } from "@/components/agenda/CalendarMonthView";
import { AppointmentFormModal } from "@/components/agenda/AppointmentFormModal";
import { AppointmentDetailsModal } from "@/components/agenda/AppointmentDetailsModal";
import { QuickServiceModal } from "@/components/agenda/QuickServiceModal";
import { useAppointments, type Appointment, type AppointmentFormData, type QuickServiceFormData } from "@/hooks/useAppointments";
import { useBarbers } from "@/hooks/useBarbers";
import { useServices } from "@/hooks/useServices";
import { useCurrentUnit } from "@/contexts/UnitContext";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/integrations/supabase/types";

type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

export default function Agenda() {
  const { currentUnitId } = useCurrentUnit();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarViewType>("week");
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isQuickServiceModalOpen, setIsQuickServiceModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [initialSlotDate, setInitialSlotDate] = useState<Date | undefined>();
  const [initialSlotBarberId, setInitialSlotBarberId] = useState<string | undefined>();

  // Calculate date range based on view
  const dateRange = useMemo(() => {
    switch (view) {
      case "day":
        return { start: startOfDay(currentDate), end: endOfDay(currentDate) };
      case "week":
        return { start: startOfWeek(currentDate, { weekStartsOn: 0 }), end: endOfWeek(currentDate, { weekStartsOn: 0 }) };
      case "month":
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        return { 
          start: startOfWeek(monthStart, { weekStartsOn: 0 }), 
          end: endOfWeek(monthEnd, { weekStartsOn: 0 }) 
        };
    }
  }, [currentDate, view]);

  const { barbers, isLoading: barbersLoading } = useBarbers(currentUnitId);
  const { services, isLoading: servicesLoading } = useServices(currentUnitId);
  const { 
    appointments: allAppointments, 
    isLoading: appointmentsLoading,
    isFetching: appointmentsFetching,
    refetch: refetchAppointments,
    createAppointment, 
    updateAppointment,
    updateStatus,
    deleteAppointment,
    deleteCancelledAppointments,
    createQuickService,
  } = useAppointments(dateRange.start, dateRange.end, selectedBarberId);

  // Count cancelled appointments
  const cancelledCount = useMemo(() => {
    return allAppointments.filter(apt => apt.status === 'cancelled').length;
  }, [allAppointments]);

  // Filter appointments based on showCancelled toggle
  const appointments = useMemo(() => {
    if (showCancelled) {
      return allAppointments;
    }
    return allAppointments.filter(apt => apt.status !== 'cancelled');
  }, [allAppointments, showCancelled]);

  const isLoading = barbersLoading || servicesLoading || appointmentsLoading;

  const handleSlotClick = (date: Date, barberId?: string) => {
    setSelectedAppointment(null);
    setInitialSlotDate(date);
    setInitialSlotBarberId(barberId);
    setIsFormModalOpen(true);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
  };

  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setView("day");
  };

  const handleNewAppointment = () => {
    setSelectedAppointment(null);
    setInitialSlotDate(new Date());
    setInitialSlotBarberId(undefined);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (data: AppointmentFormData) => {
    if (selectedAppointment) {
      await updateAppointment.mutateAsync({ id: selectedAppointment.id, ...data });
    } else {
      await createAppointment.mutateAsync(data);
    }
    setIsFormModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleEditFromDetails = () => {
    setIsDetailsModalOpen(false);
    setInitialSlotDate(selectedAppointment ? new Date(selectedAppointment.start_time) : undefined);
    setInitialSlotBarberId(selectedAppointment?.barber_id || undefined);
    setIsFormModalOpen(true);
  };

  const handleStatusChange = async (status: AppointmentStatus) => {
    if (selectedAppointment) {
      await updateStatus.mutateAsync({ id: selectedAppointment.id, status });
      setIsDetailsModalOpen(false);
    }
  };

  const handleDelete = async () => {
    if (selectedAppointment) {
      await deleteAppointment.mutateAsync(selectedAppointment.id);
      setIsDetailsModalOpen(false);
      setSelectedAppointment(null);
    }
  };

  const handleDeleteFromForm = async () => {
    if (selectedAppointment) {
      await deleteAppointment.mutateAsync(selectedAppointment.id);
      setIsFormModalOpen(false);
      setSelectedAppointment(null);
    }
  };

  const handleQuickServiceSubmit = async (data: QuickServiceFormData) => {
    await createQuickService.mutateAsync(data);
    setIsQuickServiceModalOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <CalendarHeader
          currentDate={currentDate}
          view={view}
          barbers={barbers}
          selectedBarberId={selectedBarberId}
          showCancelled={showCancelled}
          cancelledCount={cancelledCount}
          onDateChange={setCurrentDate}
          onViewChange={setView}
          onBarberChange={setSelectedBarberId}
          onShowCancelledChange={setShowCancelled}
          onClearCancelled={() => deleteCancelledAppointments.mutate()}
          isClearingCancelled={deleteCancelledAppointments.isPending}
          onNewAppointment={handleNewAppointment}
          onQuickService={() => setIsQuickServiceModalOpen(true)}
          onRefresh={() => refetchAppointments()}
          isRefreshing={appointmentsFetching}
        />

        {isLoading ? (
          <div className="flex-1 p-4">
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-[500px] w-full" />
            </div>
          </div>
        ) : (
          <>
            {view === "week" && (
              <CalendarWeekView
                currentDate={currentDate}
                appointments={appointments}
                onAppointmentClick={handleAppointmentClick}
                onSlotClick={handleSlotClick}
              />
            )}
            {view === "day" && (
              <CalendarDayView
                currentDate={currentDate}
                appointments={appointments}
                barbers={barbers}
                selectedBarberId={selectedBarberId}
                onAppointmentClick={handleAppointmentClick}
                onSlotClick={handleSlotClick}
              />
            )}
            {view === "month" && (
              <CalendarMonthView
                currentDate={currentDate}
                appointments={appointments}
                onAppointmentClick={handleAppointmentClick}
                onDayClick={handleDayClick}
              />
            )}
          </>
        )}

        <AppointmentFormModal
          open={isFormModalOpen}
          onOpenChange={setIsFormModalOpen}
          barbers={barbers}
          services={services}
          initialDate={initialSlotDate}
          initialBarberId={initialSlotBarberId}
          appointment={selectedAppointment}
          onSubmit={handleFormSubmit}
          onDelete={handleDeleteFromForm}
          isLoading={createAppointment.isPending || updateAppointment.isPending}
          isDeleting={deleteAppointment.isPending}
        />

        <AppointmentDetailsModal
          open={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
          appointment={selectedAppointment}
          onEdit={handleEditFromDetails}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          isLoading={updateStatus.isPending || deleteAppointment.isPending}
        />

        <QuickServiceModal
          open={isQuickServiceModalOpen}
          onOpenChange={setIsQuickServiceModalOpen}
          barbers={barbers}
          services={services}
          onSubmit={handleQuickServiceSubmit}
          isLoading={createQuickService.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
