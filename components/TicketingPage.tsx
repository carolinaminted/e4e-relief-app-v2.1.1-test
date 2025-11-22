
import React, { useState, useEffect } from 'react';

// Define the type for a ticket
interface Ticket {
  id: string;
  subject: string;
  description: string;
  submittedDate: string;
  status: 'Open' | 'In Progress' | 'Closed';
}

// Mock data for initial tickets
const mockTickets: Ticket[] = [
  {
    id: 'TKT-001',
    subject: 'Issue with my last application',
    description: 'The status of my last application (APP-1001) shows as Awarded, but I have not received the payment yet. Can you please check on this?',
    submittedDate: '2023-09-15',
    status: 'Closed',
  },
  {
    id: 'TKT-002',
    subject: 'How to update my mailing address?',
    description: 'I have moved recently and need to update my mailing address in my profile. I can\'t seem to find the option to edit it.',
    submittedDate: '2023-10-02',
    status: 'In Progress',
  },
   {
    id: 'TKT-003',
    subject: 'Question about eligibility for Winter Storm event',
    description: 'My area was affected by the recent winter storm, but I am not sure if I am eligible to apply for relief. Can you provide more details?',
    submittedDate: new Date().toLocaleDateString('en-CA'), // Today's date
    status: 'Open',
  },
];

// Define Page type for navigation
type Page = 'fundPortal';

interface TicketingPageProps {
  navigate: (page: Page) => void;
}

// --- Reusable UI Components ---
const ChevronIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-[var(--theme-accent)] transition-transform duration-300 transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, error?: string }> = ({ label, id, error, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-white mb-1">{label}</label>
        <input id={id} {...props} className={`w-full bg-transparent border-0 border-b p-2 text-base text-white focus:outline-none focus:ring-0 ${error ? 'border-red-500' : 'border-[var(--theme-border)] focus:border-[var(--theme-accent)]'}`} />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
);

const FormTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string, error?: string }> = ({ label, id, error, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-white mb-1">{label}</label>
        <textarea id={id} {...props} className={`w-full bg-transparent border-0 border-b p-2 text-base text-white focus:outline-none focus:ring-0 ${error ? 'border-red-500' : 'border-[var(--theme-border)] focus:border-[var(--theme-accent)]'}`} />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
);

const statusStyles: Record<Ticket['status'], string> = {
    Open: 'bg-green-800/80 text-green-200',
    'In Progress': 'bg-[var(--theme-accent)]/50 text-white',
    Closed: 'bg-gray-700 text-gray-300',
};

const TicketingPage: React.FC<TicketingPageProps> = ({ navigate }) => {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [openSection, setOpenSection] = useState<'submit' | 'view' | null>(() => {
    const saved = localStorage.getItem('ticketingPage_openSection');
    return saved ? JSON.parse(saved) : null;
  });
  
  useEffect(() => {
    localStorage.setItem('ticketingPage_openSection', JSON.stringify(openSection));
  }, [openSection]);
  
  const [newTicket, setNewTicket] = useState({ subject: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const toggleSection = (section: 'submit' | 'view') => {
    setOpenSection(prev => (prev === section ? null : section));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewTicket(prev => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!newTicket.subject.trim()) {
      newErrors.subject = 'Subject is required.';
    }
    if (!newTicket.description.trim()) {
      newErrors.description = 'Description is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitSuccess(false);

    // Simulate API call
    setTimeout(() => {
      const createdTicket: Ticket = {
        id: `TKT-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        subject: newTicket.subject,
        description: newTicket.description,
        submittedDate: new Date().toLocaleDateString('en-CA'),
        status: 'Open',
      };

      setTickets(prev => [createdTicket, ...prev]); // Add to the top of the list
      setNewTicket({ subject: '', description: '' });
      setIsSubmitting(false);
      setSubmitSuccess(true);
      
      setOpenSection('view');

      setTimeout(() => setSubmitSuccess(false), 4000); // Hide success message after 4 seconds
    }, 1000);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
      <div className="relative flex justify-center items-center mb-8">
        <button onClick={() => navigate('fundPortal')} className="absolute left-0 md:left-auto md:right-full md:mr-8 text-[var(--theme-accent)] hover:opacity-80 transition-opacity" aria-label="Back to Fund Portal">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
        </button>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">Ticketing</h1>
      </div>
      
      <div className="space-y-4">
        {/* Submit a New Ticket Section */}
        <div className="bg-[var(--theme-bg-primary)]/50 rounded-lg border border-[var(--theme-border)]">
            <button type="button" onClick={() => toggleSection('submit')} className="w-full flex justify-between items-center text-left p-4" aria-expanded={openSection === 'submit'}>
                <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">Submit a New Ticket</h2>
                <ChevronIcon isOpen={openSection === 'submit'} />
            </button>
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSection === 'submit' ? 'max-h-[1000px] opacity-100 p-4 pt-0 border-t border-[var(--theme-border)]/50' : 'max-h-0 opacity-0'}`}>
                <form onSubmit={handleSubmit} noValidate className="pt-4 space-y-4">
                    <FormInput label="Subject" id="subject" value={newTicket.subject} onChange={handleInputChange} error={errors.subject} required />
                    <FormTextarea label="Description" id="description" value={newTicket.description} onChange={handleInputChange} error={errors.description} rows={5} required />
                    
                    {submitSuccess && (
                        <p className="text-green-400 text-sm">Your ticket has been submitted successfully!</p>
                    )}
                    
                    <div className="flex justify-end">
                        <button type="submit" disabled={isSubmitting} className="bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-bold py-2 px-6 rounded-md transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-wait">
                            {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        {/* My Tickets Section */}
        <div className="bg-[var(--theme-bg-primary)]/50 rounded-lg border border-[var(--theme-border)]">
            <button type="button" onClick={() => toggleSection('view')} className="w-full flex justify-between items-center text-left p-4" aria-expanded={openSection === 'view'}>
                <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">My Tickets</h2>
                <ChevronIcon isOpen={openSection === 'view'} />
            </button>
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSection === 'view' ? 'max-h-[3000px] opacity-100 p-4 pt-0 border-t border-[var(--theme-border)]/50' : 'max-h-0 opacity-0'}`}>
                <div className="pt-4 space-y-3">
                    {tickets.length > 0 ? (
                        tickets.map(ticket => (
                            <div key={ticket.id} className="bg-[var(--theme-bg-secondary)]/60 p-4 rounded-md">
                                <div className="flex justify-between items-start flex-wrap gap-2">
                                    <p className="font-semibold text-white truncate pr-4">{ticket.subject}</p>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusStyles[ticket.status]}`}>{ticket.status}</span>
                                </div>
                                <p className="text-sm text-gray-300 mt-1">Submitted on: {ticket.submittedDate}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-400 py-4">You have no submitted tickets.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TicketingPage;
