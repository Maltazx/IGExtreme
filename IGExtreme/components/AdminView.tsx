
import React, { useState, useMemo, useEffect } from 'react';
import type { Professional, Client, WhatsappConfig, MessageTemplates, Availability, ClientFile, ChatMessage, Appointment, WebhookConfig } from '../types';
import ChatWindow from './ChatWindow';

type AdminSection = 'agenda' | 'profissionais' | 'clientes' | 'configuracoes' | 'agendamentos' | 'webhooks';

interface AdminViewProps {
    professionals: Professional[];
    clients: Client[];
    availability: { [professionalId:string]: Availability };
    whatsappConfig: WhatsappConfig;
    messageTemplates: MessageTemplates;
    webhookConfig: WebhookConfig;
    onUpdateAvailability: (professionalId: string, date: string, times: string[]) => void;
    onAddProfessional: (name: string) => void;
    onUpdateProfessional: (professional: Professional) => void;
    onDeleteProfessional: (professionalId: string) => void;
    onUpdateWhatsappConfig: (config: WhatsappConfig) => void;
    onUpdateMessageTemplates: (templates: MessageTemplates) => void;
    onUpdateWebhookConfig: (config: WebhookConfig) => void;
    onTriggerTestWebhook: (url: string, data: any) => void;
    onSendMessage: (clientId: string, message: ChatMessage) => void;
    onAddFile: (clientId: string, file: ClientFile) => void;
    onGoToClient: () => void;
    onSendReminder: (clientId: string, appointment: Appointment) => void;
    onCancelAppointment: (clientId: string, appointmentId: string) => void;
}

const AdminView: React.FC<AdminViewProps> = (props) => {
    const [activeSection, setActiveSection] = useState<AdminSection>('agendamentos'); // Start at agendamentos as requested
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const renderSection = () => {
        if (selectedClient) {
            return <ClientProfile client={selectedClient} professionals={props.professionals} onBack={() => setSelectedClient(null)} onSendMessage={props.onSendMessage} onAddFile={props.onAddFile} />;
        }
        switch (activeSection) {
            case 'agenda':
                return <ScheduleManager professionals={props.professionals} availability={props.availability} onUpdateAvailability={props.onUpdateAvailability} />;
            case 'profissionais':
                return <ProfessionalsManager 
                            professionals={props.professionals} 
                            onAddProfessional={props.onAddProfessional} 
                            onDeleteProfessional={props.onDeleteProfessional}
                            onUpdateProfessional={props.onUpdateProfessional}
                        />;
            case 'clientes':
                return <ClientsList clients={props.clients} onSelectClient={setSelectedClient} />;
            case 'agendamentos':
                return <AllAppointmentsManager 
                            clients={props.clients} 
                            professionals={props.professionals}
                            onSendReminder={props.onSendReminder}
                            onCancelAppointment={props.onCancelAppointment}
                       />;
            case 'configuracoes':
                return <Settings 
                    whatsappConfig={props.whatsappConfig} 
                    messageTemplates={props.messageTemplates}
                    onUpdateWhatsappConfig={props.onUpdateWhatsappConfig}
                    onUpdateMessageTemplates={props.onUpdateMessageTemplates}
                    />;
            case 'webhooks':
                return <WebhooksManager 
                    config={props.webhookConfig}
                    onUpdateConfig={props.onUpdateWebhookConfig}
                    onTest={props.onTriggerTestWebhook}
                />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
            <nav className="bg-white md:w-64 p-4 md:p-6 shadow-md z-10 flex flex-col">
                <div className="mb-8 text-center">
                    <img src="https://igextreme.com.br/wp-content/uploads/2025/09/Design-sem-nome-13.png" alt="Igextreme Agendamento Logo" className="h-12 w-auto mx-auto mb-4"/>
                    <h1 className="text-xl font-bold text-gray-800">Painel Admin</h1>
                </div>
                <ul className="space-y-2 flex-grow">
                    <NavItem label="Agendamentos" onClick={() => { setActiveSection('agendamentos'); setSelectedClient(null); }} isActive={activeSection === 'agendamentos'} />
                    <NavItem label="Agenda" onClick={() => { setActiveSection('agenda'); setSelectedClient(null); }} isActive={activeSection === 'agenda'} />
                    <NavItem label="Profissionais" onClick={() => { setActiveSection('profissionais'); setSelectedClient(null); }} isActive={activeSection === 'profissionais'} />
                    <NavItem label="Clientes" onClick={() => { setActiveSection('clientes'); setSelectedClient(null); }} isActive={activeSection === 'clientes'} />
                    <NavItem label="Webhooks" onClick={() => { setActiveSection('webhooks'); setSelectedClient(null); }} isActive={activeSection === 'webhooks'} />
                    <NavItem label="Configurações" onClick={() => { setActiveSection('configuracoes'); setSelectedClient(null); }} isActive={activeSection === 'configuracoes'} />
                </ul>
                
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <button 
                        onClick={props.onGoToClient}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-primary-dark text-primary-dark rounded-lg hover:bg-primary-dark hover:text-white transition-all duration-300 font-semibold"
                    >
                        <span>👁️</span> Ver como Cliente
                    </button>
                </div>
            </nav>
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                {renderSection()}
            </main>
        </div>
    );
};

const NavItem = ({ label, onClick, isActive }: { label: string, onClick: () => void, isActive: boolean }) => (
    <li>
        <button onClick={onClick} className={`w-full p-3 rounded-lg text-left transition-colors duration-200 ${isActive ? 'bg-primary-light text-primary-dark font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
            {label}
        </button>
    </li>
);

const WebhooksManager = ({ config, onUpdateConfig, onTest }: { config: WebhookConfig, onUpdateConfig: (c: WebhookConfig) => void, onTest: (url: string, data: any) => void }) => {
    const [localConfig, setLocalConfig] = useState(config);
    const [apiKey, setApiKey] = useState(config.headers?.['apikey'] || '');

    useEffect(() => {
        setLocalConfig(config);
        setApiKey(config.headers?.['apikey'] || '');
    }, [config]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setLocalConfig({ ...localConfig, [e.target.name]: e.target.value });
    };

    const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApiKey(e.target.value);
        // Atualiza o header em tempo real no config local
        const newHeaders = { ...localConfig.headers, 'apikey': e.target.value };
        setLocalConfig(prev => ({ ...prev, headers: newHeaders }));
    };

    const handleSave = () => {
        onUpdateConfig(localConfig);
        alert('Configurações de Webhook salvas!');
    };

    const handleTestBooking = () => {
        onTest(localConfig.bookingUrl, {
            event: 'test_booking',
            message: 'Teste de Webhook de Agendamento',
            data: { client: 'João Teste', date: '2025-12-31', time: '10:00' },
            client: { name: 'Teste', phone: '5511999999999' } // Dados mock para formato Evolution
        });
        alert('Disparo de teste enviado! Verifique seu sistema externo.');
    };

    const handleTestCancellation = () => {
         onTest(localConfig.cancellationUrl, {
            event: 'test_cancellation',
            message: 'Teste de Webhook de Cancelamento',
            data: { client: 'Maria Teste', reason: 'Teste administrativo' },
            client: { name: 'Teste', phone: '5511999999999' } // Dados mock para formato Evolution
        });
        alert('Disparo de teste enviado! Verifique seu sistema externo.');
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Automação (Webhooks)</h2>
            <p className="text-gray-600 mb-8">
                Configure URLs para disparar ações automáticas em outros sistemas quando eventos ocorrerem aqui.
            </p>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                 <h3 className="text-blue-800 font-semibold mb-2">Compatibilidade Evolution API</h3>
                 <p className="text-blue-700 text-sm">
                    Você pode configurar os webhooks para enviar dados no formato padrão (JSON Completo) para sistemas como n8n/Zapier,
                    OU configurar para enviar diretamente para endpoints da Evolution API (formato de mensagem de texto).
                 </p>
                 <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Formato do Payload (Dados Enviados)</label>
                    <select 
                        name="format" 
                        value={localConfig.format || 'STANDARD_JSON'} 
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:outline-none"
                    >
                        <option value="STANDARD_JSON">Padrão (JSON Completo - para n8n, Zapier, Typebot)</option>
                        <option value="EVOLUTION_API_TEXT">Evolution API (Mensagem de Texto - /message/sendText)</option>
                    </select>
                 </div>
                 <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key (Global para Webhooks)</label>
                    <input
                        type="text"
                        value={apiKey}
                        onChange={handleApiKeyChange}
                        placeholder="Sua API Key da Evolution (opcional, enviada no Header 'apikey')"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Necessário apenas se você estiver chamando a Evolution API diretamente.</p>
                 </div>
            </div>

            <div className="grid gap-8">
                {/* Booking Webhook */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Ao Criar Agendamento</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        URL chamada (POST) ao criar novo agendamento.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input 
                            type="text" 
                            name="bookingUrl" 
                            value={localConfig.bookingUrl} 
                            onChange={handleChange} 
                            className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:outline-none"
                            placeholder={localConfig.format === 'EVOLUTION_API_TEXT' ? "https://api.../message/sendText/instance" : "https://webhook..."}
                        />
                        <button 
                            onClick={handleTestBooking}
                            className="px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Testar Disparo
                        </button>
                    </div>
                </div>

                {/* Cancellation Webhook */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Ao Cancelar Agendamento</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        URL chamada (POST) ao cancelar agendamento.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input 
                            type="text" 
                            name="cancellationUrl" 
                            value={localConfig.cancellationUrl} 
                            onChange={handleChange} 
                            className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:outline-none"
                            placeholder={localConfig.format === 'EVOLUTION_API_TEXT' ? "https://api.../message/sendText/instance" : "https://webhook..."}
                        />
                         <button 
                            onClick={handleTestCancellation}
                            className="px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Testar Disparo
                        </button>
                    </div>
                </div>

                <button 
                    onClick={handleSave}
                    className="w-full sm:w-auto self-end px-8 py-3 bg-primary-dark text-white font-bold rounded-lg hover:bg-yellow-600 shadow-md hover:shadow-lg transition-all"
                >
                    Salvar Todas as Configurações
                </button>
            </div>
        </div>
    );
};

const AllAppointmentsManager = ({ clients, professionals, onSendReminder, onCancelAppointment }: { 
    clients: Client[], 
    professionals: Professional[],
    onSendReminder: (clientId: string, appointment: Appointment) => void,
    onCancelAppointment: (clientId: string, appointmentId: string) => void
}) => {
    const [appointmentToDelete, setAppointmentToDelete] = useState<{clientId: string, appointmentId: string} | null>(null);

    // Flatten all appointments into a single list
    const allAppointments = useMemo(() => {
        const apps: (Appointment & { clientName: string, clientPhone: string, professionalName: string })[] = [];
        clients.forEach(client => {
            client.appointments.forEach(app => {
                const professional = professionals.find(p => p.id === app.professionalId);
                apps.push({
                    ...app,
                    clientName: client.name,
                    clientPhone: client.phone,
                    professionalName: professional ? professional.name : 'Desconhecido'
                });
            });
        });
        // Sort by date then time (descending - newest first)
        return apps.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA.getTime() - dateB.getTime(); // Ascending order
        });
    }, [clients, professionals]);

    const handleCancelClick = (clientId: string, appointmentId: string) => {
        setAppointmentToDelete({ clientId, appointmentId });
    };

    const confirmCancel = () => {
        if (appointmentToDelete) {
            onCancelAppointment(appointmentToDelete.clientId, appointmentToDelete.appointmentId);
            setAppointmentToDelete(null);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Todos os Agendamentos</h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profissional</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {allAppointments.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">Nenhum agendamento encontrado.</td>
                                </tr>
                            )}
                            {allAppointments.map((app) => (
                                <tr key={app.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {new Date(app.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                                        </div>
                                        <div className="text-sm text-gray-500">{app.time}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{app.clientName}</div>
                                        <div className="text-sm text-gray-500">{app.clientPhone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                            {app.professionalName}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-3">
                                        <button 
                                            onClick={() => onSendReminder(app.clientId, app)}
                                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors"
                                            title="Enviar lembrete no WhatsApp"
                                        >
                                            🔔 Lembrete
                                        </button>
                                        <button 
                                            onClick={() => handleCancelClick(app.clientId, app.id)}
                                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-colors"
                                            title="Cancelar agendamento"
                                        >
                                            ❌ Cancelar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

             {/* Modal de Confirmação de Cancelamento */}
             {appointmentToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full transform transition-all scale-100 border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Cancelar Agendamento</h3>
                        <p className="text-gray-700 mb-8 text-lg text-center">
                            Têm certeza que deseja cancelar este agendamento?
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button
                                onClick={() => setAppointmentToDelete(null)}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium transition-all duration-200 hover:bg-red-600 hover:text-white hover:border-red-600 focus:outline-none"
                            >
                                Fechar
                            </button>
                            <button
                                onClick={confirmCancel}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium transition-all duration-200 hover:bg-green-600 hover:text-white hover:border-green-600 focus:outline-none"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    return days;
};
const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

const defaultBusinessHours = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
];

const ScheduleManager = ({ professionals, availability, onUpdateAvailability }: Pick<AdminViewProps, 'professionals' | 'availability' | 'onUpdateAvailability'>) => {
    const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(professionals.length > 0 ? professionals[0].id : null);
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentTimes, setCurrentTimes] = useState<string[]>([]);
    const [newTime, setNewTime] = useState('');
    const [showSaveToast, setShowSaveToast] = useState(false);

    useEffect(() => {
        // This effect synchronizes the selected professional with the professionals list.
        // If the currently selected professional is deleted, it resets to the first in the list.
        setSelectedProfessionalId(currentId => {
            const idIsValid = currentId && professionals.some(p => p.id === currentId);
            if (idIsValid) {
                return currentId; // Keep the current valid ID
            }
            // If the ID is invalid or null, reset to the first available professional
            return professionals.length > 0 ? professionals[0].id : null;
        });
    }, [professionals]);

    useEffect(() => {
        if (selectedProfessionalId) {
            const dateKey = formatDateKey(selectedDate);
            const professionalAvailability = availability[selectedProfessionalId] || {};
            const timesForDate = professionalAvailability[dateKey];
            setCurrentTimes(timesForDate || [...defaultBusinessHours]);
        } else {
            setCurrentTimes([]);
        }
    }, [selectedProfessionalId, selectedDate, availability]);

    const handleSaveChanges = () => {
        if (selectedProfessionalId) {
            onUpdateAvailability(selectedProfessionalId, formatDateKey(selectedDate), currentTimes.sort());
            setShowSaveToast(true);
            setTimeout(() => {
                setShowSaveToast(false);
            }, 3000);
        }
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 4) value = value.slice(0, 4);
        
        if (value.length > 2) {
            value = `${value.slice(0, 2)}:${value.slice(2)}`;
        }
        setNewTime(value);
    };

    const handleAddTime = () => {
        // Regex to validate HH:MM format (00:00 - 23:59)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        
        if (newTime && timeRegex.test(newTime) && !currentTimes.includes(newTime)) {
            setCurrentTimes(prev => [...prev, newTime].sort());
            setNewTime('');
        } else if (newTime && !timeRegex.test(newTime)) {
            alert("Por favor, insira um horário válido no formato 24h (ex: 13:30).");
        }
    };

    const handleRemoveTime = (timeToRemove: string) => {
        setCurrentTimes(prev => prev.filter(time => time !== timeToRemove));
    };

    const handleResetToDefault = () => {
        setCurrentTimes([...defaultBusinessHours]);
    };

    const daysOfMonth = useMemo(() => getDaysInMonth(currentMonthDate.getFullYear(), currentMonthDate.getMonth()), [currentMonthDate]);
    const firstDayOfMonth = daysOfMonth.length > 0 ? daysOfMonth[0].getDay() : 0;

    const handlePrevMonth = () => {
        setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
    };
    
    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Gerenciar Agendas</h2>
            <div className="bg-white p-6 rounded-lg shadow-md">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Column 1: Professional and Calendar */}
                    <div>
                        <div className="mb-4">
                            <label htmlFor="professional-select" className="block text-sm font-medium text-gray-700 mb-1">
                                Selecione o Profissional
                            </label>
                            <select
                                id="professional-select"
                                value={selectedProfessionalId || ''}
                                onChange={(e) => setSelectedProfessionalId(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:outline-none"
                                disabled={professionals.length === 0}
                            >
                                {professionals.length === 0 && <option>Nenhum profissional cadastrado</option>}
                                {professionals.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-200 text-primary-dark font-bold text-xl">&lt;</button>
                                <h3 className="text-md font-semibold text-gray-800 capitalize">
                                    {currentMonthDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                                </h3>
                                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-200 text-primary-dark font-bold text-xl">&gt;</button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 font-semibold">
                                {dayNames.map(day => <div key={day}>{day}</div>)}
                            </div>
                            <div className="grid grid-cols-7 gap-1 mt-2">
                                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
                                {daysOfMonth.map(day => {
                                    const isSelected = day.toDateString() === selectedDate.toDateString();
                                    const isToday = day.toDateString() === new Date().toDateString();
                                    return (
                                        <button
                                            key={day.toString()}
                                            onClick={() => setSelectedDate(day)}
                                            className={`p-2 rounded-full text-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-colors duration-200
                                                ${isSelected ? 'bg-primary-dark text-white' : 'text-primary-dark hover:bg-primary-light'}
                                                ${!isSelected && isToday ? 'font-bold' : ''}
                                            `}
                                        >
                                            {day.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Time Slot Management */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-center text-primary-dark">
                            Horários para {selectedDate.toLocaleDateString('pt-BR')}
                        </h3>
                        
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-64 overflow-y-auto mb-4">
                            <h4 className="text-center text-primary-dark font-semibold sticky top-0 bg-gray-50 pb-2 z-10">
                                Horários para {selectedDate.toLocaleDateString('pt-BR')}
                            </h4>
                            {currentTimes.length > 0 ? (
                                <ul className="space-y-2">
                                    {currentTimes.map(time => (
                                        <li key={time} className="flex items-center justify-between bg-white p-2 rounded shadow-sm">
                                            <span className="font-mono text-gray-700">{time}</span>
                                            <button onClick={() => handleRemoveTime(time)} className="text-red-500 hover:text-red-700 font-bold text-xl leading-none px-2 rounded-full hover:bg-red-100">&times;</button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 text-center py-4">Nenhum horário definido. Adicione um ou resete para o padrão.</p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="text"
                                value={newTime}
                                onChange={handleTimeChange}
                                placeholder="00:00"
                                maxLength={5}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:outline-none text-center font-mono tracking-widest placeholder-gray-400"
                            />
                            <button onClick={handleAddTime} className="px-4 py-2 bg-primary-dark text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors whitespace-nowrap">Adicionar</button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                           <button onClick={handleResetToDefault} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-colors">Resetar p/ Padrão</button>
                           <button onClick={handleSaveChanges} className="w-full px-4 py-3 bg-primary-dark text-white font-bold rounded-lg hover:bg-yellow-600 transition-colors">Salvar Alterações</button>
                        </div>
                    </div>
                </div>
            </div>
            {showSaveToast && (
                <>
                    <style>{`
                        @keyframes toast-lifecycle {
                            0% { opacity: 0; transform: translate(-50%, 20px); }
                            10% { opacity: 1; transform: translate(-50%, 0); }
                            80% { opacity: 1; transform: translate(-50%, 0); }
                            100% { opacity: 0; transform: translate(-50%, 20px); }
                        }
                    `}</style>
                    <div 
                        className="fixed bottom-10 left-1/2 bg-primary-dark text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center gap-2"
                        style={{ animation: 'toast-lifecycle 3s forwards' }}
                    >
                        <span className="font-bold">✓</span> Alterações Salvas
                    </div>
                </>
            )}
        </div>
    );
};

const ProfessionalsManager = ({ professionals, onAddProfessional, onDeleteProfessional, onUpdateProfessional }: Pick<AdminViewProps, 'professionals' | 'onAddProfessional' | 'onDeleteProfessional' | 'onUpdateProfessional'>) => {
    const [name, setName] = useState('');
    const [professionalToDelete, setProfessionalToDelete] = useState<Professional | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onAddProfessional(name.trim());
            setName('');
        }
    };

    const handleClickDelete = (e: React.MouseEvent, professional: Professional) => {
        e.preventDefault();
        e.stopPropagation();
        setProfessionalToDelete(professional);
    };

    const confirmDelete = () => {
        if (professionalToDelete) {
            onDeleteProfessional(professionalToDelete.id);
            setProfessionalToDelete(null);
        }
    };

    const cancelDelete = () => {
        setProfessionalToDelete(null);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, professional: Professional) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const newAvatarUrl = URL.createObjectURL(file);
            onUpdateProfessional({ ...professional, avatarUrl: newAvatarUrl });
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Profissionais</h2>
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 className="text-lg font-semibold mb-4">Adicionar Novo Profissional</h3>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nome do profissional"
                        className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:outline-none bg-gray-400 text-white placeholder-white"
                    />
                    <button type="submit" className="px-6 py-3 bg-primary-dark text-white font-bold rounded-lg hover:bg-yellow-600 transition-colors">Adicionar</button>
                </form>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Lista de Profissionais</h3>
                <ul className="space-y-3">
                    {professionals.map(p => (
                        <li key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                                <div className="relative group mr-4 cursor-pointer">
                                    <img src={p.avatarUrl} alt={p.name} className="w-12 h-12 rounded-full object-cover" />
                                    <label htmlFor={`upload-${p.id}`} className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-xs opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer">
                                        Foto
                                    </label>
                                    <input 
                                        type="file" 
                                        id={`upload-${p.id}`} 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={(e) => handlePhotoChange(e, p)}
                                    />
                                </div>
                                <span className="text-gray-800 font-medium">{p.name}</span>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => handleClickDelete(e, p)}
                                className="px-4 py-2 text-sm text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors cursor-pointer z-10"
                                aria-label={`Excluir ${p.name}`}
                            >
                                Excluir
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Modal de Confirmação */}
            {professionalToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full transform transition-all scale-100 border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Confirmar Exclusão</h3>
                        <p className="text-gray-700 mb-8 text-lg text-center">
                            Têm certeza que deseja excluir esse funcionário?
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button
                                onClick={cancelDelete}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium transition-all duration-200 hover:bg-red-600 hover:text-white hover:border-red-600 focus:outline-none"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium transition-all duration-200 hover:bg-green-600 hover:text-white hover:border-green-600 focus:outline-none"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ClientsList = ({ clients, onSelectClient }: { clients: Client[], onSelectClient: (client: Client) => void }) => {
    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Clientes</h2>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <ul className="divide-y divide-gray-200">
                    {clients.map(client => (
                        <li key={client.id} className="py-4 flex items-center justify-between">
                            <div>
                                <p className="text-lg font-medium text-gray-800">{client.name}</p>
                                <p className="text-sm text-gray-500">{client.phone}</p>
                            </div>
                            <button onClick={() => onSelectClient(client)} className="px-4 py-2 text-sm border border-primary-dark text-primary-dark font-semibold rounded-lg hover:bg-primary-light transition-colors">
                                Ver Ficha
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const ClientProfile = ({ client, onBack, onSendMessage, professionals, onAddFile }: { client: Client, onBack: () => void, onSendMessage: (clientId: string, message: ChatMessage) => void, professionals: Professional[], onAddFile: (clientId: string, file: ClientFile) => void }) => {
    const [activeTab, setActiveTab] = useState('agendamentos');

    const handleAdminSendMessage = (text: string) => {
        const newMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            sender: 'professional',
            text,
            timestamp: new Date().toISOString()
        };
        onSendMessage(client.id, newMessage);
    };

    return (
        <div>
            <button onClick={onBack} className="text-primary-dark hover:underline mb-6">&larr; Voltar para a lista de clientes</button>
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{client.name}</h2>
                <p className="text-gray-500">{client.phone}</p>
            </div>
            <div className="flex border-b border-gray-200 mb-6">
                <TabButton label="Agendamentos" isActive={activeTab === 'agendamentos'} onClick={() => setActiveTab('agendamentos')} />
                <TabButton label="Conversas" isActive={activeTab === 'conversas'} onClick={() => setActiveTab('conversas')} />
                <TabButton label="Documentos" isActive={activeTab === 'documentos'} onClick={() => setActiveTab('documentos')} />
            </div>
            <div>
                {activeTab === 'agendamentos' && (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <ul className="space-y-3">
                            {client.appointments.map(app => {
                                const professional = professionals.find(p => p.id === app.professionalId);
                                return (
                                <li key={app.id} className="p-3 bg-gray-50 rounded-lg">
                                    <p><strong>Data:</strong> {new Date(app.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {app.time}</p>
                                    <p><strong>Profissional:</strong> {professional ? professional.name : 'Excluído'}</p>
                                </li>
                            )})}
                        </ul>
                    </div>
                )}
                {activeTab === 'conversas' && (
                    <div className="h-[60vh]">
                        <ChatWindow 
                            messages={client.chatHistory}
                            onSendMessage={handleAdminSendMessage}
                            title={`Conversa com ${client.name}`}
                        />
                    </div>
                )}
                {activeTab === 'documentos' && <DocumentsManager client={client} onAddFile={onAddFile} />}
            </div>
        </div>
    );
};

const TabButton = ({label, isActive, onClick}: {label: string, isActive: boolean, onClick: () => void}) => (
    <button onClick={onClick} className={`py-2 px-4 text-sm font-medium transition-colors ${isActive ? 'border-b-2 border-primary-dark text-primary-dark' : 'text-gray-500 hover:text-gray-700'}`}>
        {label}
    </button>
);

const DocumentsManager = ({ client, onAddFile }: { client: Client; onAddFile: (clientId: string, file: ClientFile) => void; }) => {

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const newFile = e.target.files[0];
            // In a real app, this would be uploaded to a server.
            // Here we just add it to the main app state.
            const newFileEntry: ClientFile = {
                id: Date.now().toString(),
                name: newFile.name,
                url: URL.createObjectURL(newFile),
                type: newFile.type.startsWith('image/') ? 'image' : 'document',
                uploadedAt: new Date().toLocaleDateString('pt-BR').split('/').reverse().join('/') // Just to handle the split correctly if needed, but simplified:
            };
            // Fix date formatting for display
            const today = new Date();
            const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
            
            onAddFile(client.id, { ...newFileEntry, uploadedAt: formattedDate });
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="mb-6">
                <label htmlFor="file-upload" className="w-full cursor-pointer bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-100 text-center">
                    <span className="text-primary-dark font-semibold">Clique para anexar</span>
                    <span className="text-sm text-gray-500 mt-1">Fotos ou documentos</span>
                </label>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileUpload} />
            </div>

            <h3 className="text-lg font-semibold mb-4">Arquivos Anexados</h3>
            <ul className="space-y-3">
                {client.files.map(file => (
                    <li key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-primary-dark hover:underline">
                            {file.name}
                        </a>
                        <span className="text-sm text-gray-500">{file.uploadedAt}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

const Settings = ({ whatsappConfig, messageTemplates, onUpdateWhatsappConfig, onUpdateMessageTemplates }: Pick<AdminViewProps, 'whatsappConfig' | 'messageTemplates' | 'onUpdateWhatsappConfig'| 'onUpdateMessageTemplates'>) => {
    const [waConfig, setWaConfig] = useState(whatsappConfig);
    const [templates, setTemplates] = useState(messageTemplates);

    useEffect(() => {
        setWaConfig(whatsappConfig);
    }, [whatsappConfig]);

    useEffect(() => {
        setTemplates(messageTemplates);
    }, [messageTemplates]);

    const handleWaConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        const key = id.split('-')[1] as keyof WhatsappConfig;
        setWaConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleTemplatesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        const key = id.split('-')[1] as keyof MessageTemplates;
        setTemplates(prev => ({ ...prev, [key]: value }));
    };

    const handleWaSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateWhatsappConfig(waConfig);
        alert('Configurações do WhatsApp salvas!');
    };
    
    const handleTemplatesSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateMessageTemplates(templates);
        alert('Modelos de mensagem salvos!');
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Configurações</h2>
            <div className="space-y-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">API do WhatsApp</h3>
                    <form onSubmit={handleWaSubmit} className="space-y-4">
                        <InputField label="URL" id="wa-url" value={waConfig.url} onChange={handleWaConfigChange} />
                        <InputField label="Token API" id="wa-token" value={waConfig.token} onChange={handleWaConfigChange} />
                        <InputField label="Instância" id="wa-instance" value={waConfig.instance} onChange={handleWaConfigChange} />
                        <button type="submit" className="px-6 py-2 bg-primary-dark text-white font-bold rounded-lg hover:bg-yellow-600 transition-colors">Salvar</button>
                    </form>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Mensagens Padrões</h3>
                     <form onSubmit={handleTemplatesSubmit} className="space-y-4">
                        <TextareaField label="Mensagem de Agendamento" id="msg-booking" value={templates.booking} onChange={handleTemplatesChange} />
                        <TextareaField label="Mensagem de Confirmação" id="msg-confirmation" value={templates.confirmation} onChange={handleTemplatesChange} />
                        <TextareaField label="Mensagem de Lembrete" id="msg-reminder" value={templates.reminder} onChange={handleTemplatesChange} />
                        <TextareaField label="Mensagem de Cancelamento" id="msg-cancellation" value={templates.cancellation} onChange={handleTemplatesChange} />
                        <button type="submit" className="px-6 py-2 bg-primary-dark text-white font-bold rounded-lg hover:bg-yellow-600 transition-colors">Salvar</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const InputField = ({ label, id, ...props }: {label:string, id:string, [key:string]:any}) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input type="text" id={id} {...props} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:outline-none" />
    </div>
);

const TextareaField = ({ label, id, ...props }: {label:string, id:string, [key:string]:any}) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea id={id} {...props} rows={4} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:outline-none"></textarea>
    </div>
);


export default AdminView;