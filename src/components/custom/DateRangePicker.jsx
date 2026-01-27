import React, { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CalendarIcon, XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const DateRangePicker = ({ 
   value, 
   onChange, 
   label = "Date Range",
   placeholder = "Select date range",
   className 
}) => {
   const [isOpen, setIsOpen] = useState(false);
   const [tempRange, setTempRange] = useState({ start: null, end: null });
   const calendarRef = useRef();

   // Format date for display
   const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
         month: 'short',
         day: 'numeric',
         year: 'numeric'
      });
   };

   // Get display text for the button
   const getDisplayText = () => {
      if (value?.from && value?.to) {
         return `${formatDate(value.from)} - ${formatDate(value.to)}`;
      }
      if (value?.from) {
         return formatDate(value.from);
      }
      return placeholder;
   };

   // Handle date selection
   const handleDateClick = (info) => {
      const clickedDate = new Date(info.dateStr);
      
      if (!tempRange.start || (tempRange.start && tempRange.end)) {
         // Start new selection
         setTempRange({ start: clickedDate, end: null });
      } else if (tempRange.start && !tempRange.end) {
         // Complete the range
         const start = tempRange.start;
         const end = clickedDate;
         
         // Ensure start is before end
         if (start <= end) {
            setTempRange({ start, end });
         } else {
            setTempRange({ start: end, end: start });
         }
      }
   };

   // Apply the selected range
   const applyRange = () => {
      if (tempRange.start) {
         onChange({
            from: tempRange.start,
            to: tempRange.end || tempRange.start
         });
      }
      setIsOpen(false);
      setTempRange({ start: null, end: null });
   };

   // Cancel selection
   const cancelSelection = () => {
      setTempRange({ start: null, end: null });
      setIsOpen(false);
   };

   // Clear the current selection
   const clearSelection = () => {
      onChange({ from: null, to: null });
      setTempRange({ start: null, end: null });
   };

   // Get events for highlighting selected dates
   const getCalendarEvents = () => {
      const events = [];
      
      if (tempRange.start) {
         if (tempRange.end) {
            // Add range background
            const start = new Date(tempRange.start);
            const end = new Date(tempRange.end);
            
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
               events.push({
                  start: new Date(d).toISOString().split('T')[0],
                  display: 'background',
                  backgroundColor: '#3b82f6',
                  classNames: ['date-range-selection']
               });
            }
         } else {
            // Single date selection
            events.push({
               start: tempRange.start.toISOString().split('T')[0],
               display: 'background',
               backgroundColor: '#60a5fa',
               classNames: ['date-single-selection']
            });
         }
      }
      
      return events;
   };

   return (
      <div className={cn("relative", className)}>
         {label && <Label className="mb-2 block">{label}</Label>}
         
         <div className="flex items-center space-x-2">
            <Button
               variant="outline"
               onClick={() => setIsOpen(!isOpen)}
               className="w-[280px] justify-start text-left font-normal"
            >
               <CalendarIcon className="mr-2 h-4 w-4" />
               {getDisplayText()}
            </Button>
            
            {(value?.from || value?.to) && (
               <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="h-10 w-10 p-0"
               >
                  <XIcon className="h-4 w-4" />
               </Button>
            )}
         </div>

         {isOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 bg-white border rounded-lg shadow-lg">
               <div className="p-4">
                  <div className="mb-3 text-sm text-muted-foreground">
                     {!tempRange.start 
                        ? "Click a date to start selection" 
                        : !tempRange.end 
                        ? "Click another date to complete range"
                        : `Selected: ${formatDate(tempRange.start)} - ${formatDate(tempRange.end)}`
                     }
                  </div>
                  
                  <div className="calendar-container">
                     <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                           left: 'prev',
                           center: 'title',
                           right: 'next'
                        }}
                        height="auto"
                        dateClick={handleDateClick}
                        events={getCalendarEvents()}
                        dayMaxEvents={false}
                        showNonCurrentDates={false}
                        fixedWeekCount={false}
                     />
                  </div>

                  <div className="flex justify-end space-x-2 mt-4 pt-3 border-t">
                     <Button variant="ghost" size="sm" onClick={cancelSelection}>
                        Cancel
                     </Button>
                     <Button 
                        size="sm" 
                        onClick={applyRange}
                        disabled={!tempRange.start}
                     >
                        Apply
                     </Button>
                  </div>
               </div>
            </div>
         )}

         {/* Custom styles for the calendar */}
         <style jsx global>{`
            .calendar-container .fc {
               font-size: 0.875rem;
            }
            .calendar-container .fc-toolbar {
               margin-bottom: 1rem;
            }
            .calendar-container .fc-toolbar-title {
               font-size: 1.1rem;
               font-weight: 600;
            }
            .calendar-container .fc-button {
               background-color: transparent;
               border: 1px solid #e2e8f0;
               color: #374151;
               padding: 0.25rem 0.5rem;
               font-size: 0.875rem;
            }
            .calendar-container .fc-button:hover {
               background-color: #f8fafc;
            }
            .calendar-container .fc-button:focus {
               box-shadow: 0 0 0 2px #3b82f6;
            }
            .calendar-container .fc-daygrid-day {
               cursor: pointer;
            }
            .calendar-container .fc-daygrid-day:hover {
               background-color: #f1f5f9;
            }
            .calendar-container .fc-day-today {
               background-color: #fef3c7 !important;
            }
            .date-range-selection {
               opacity: 0.7;
            }
            .date-single-selection {
               opacity: 0.5;
            }
         `}</style>
      </div>
   );
};

export default DateRangePicker;