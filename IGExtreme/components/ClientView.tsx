
import React, { useState, useMemo } from 'react';
import type { Professional, Availability, Appointment, ChatMessage } from '../types';
import ChatWindow from './ChatWindow';

// Helper function to get days in a month
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

interface CalendarProps {
    onDateSelect: (date: Date) => void;
    selectedDate: Date | null;
    availability: Availability;
    professionalId: string;
}

const Calendar: React.FC<CalendarProps> = ({ onDateSelect, selectedDate, availability }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysOfMonth = useMemo(() => getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()), [currentDate]);
    const firstDayOfMonth = daysOfMonth[0].getDay();

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };
    
    const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

    return (
        <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 font-bold text-lg">&lt;</button>
                <h3 className="text-lg font-semibold text-gray-800 capitalize">
                    {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 font-bold text-lg">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-sm text-gray-500">
                {dayNames.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2 mt-2">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
                {daysOfMonth.map(day => {
                    const dateKey = formatDateKey(day);
                    const isAvailable = availability[dateKey] && availability[dateKey].length > 0;
                    const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                    const isToday = day.toDateString() === new Date().toDateString();

                    return (
                        <button
                            key={day.toString()}
                            onClick={() => isAvailable && onDateSelect(day)}
                            disabled={!isAvailable}
                            className={`w-10 h-10 mx-auto flex items-center justify-center rounded-2xl transition-all duration-200
                                ${isAvailable ? 'cursor-pointer' : 'cursor-default'}
                                ${isSelected 
                                    ? 'bg-primary-dark text-white font-bold shadow-md transform scale-105' 
                                    : ''}
                                ${!isSelected && isAvailable 
                                    ? 'text-gray-900 hover:bg-primary-dark hover:text-white hover:font-bold hover:shadow-md' 
                                    : ''}
                                ${!isSelected && !isAvailable ? 'text-gray-300' : ''}
                                ${!isSelected && isToday ? 'ring-1 ring-gray-300' : ''}
                            `}
                        >
                            {day.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};


interface ClientViewProps {
    professionals: Professional[];
    availability: { [professionalId: string]: Availability };
    onBookAppointment: (appointmentData: Omit<Appointment, 'id' | 'clientId'>, clientInfo: { name: string, phone: string }) => void;
    onAdminAccess: () => void;
    isAuthenticated?: boolean;
}

const ClientView: React.FC<ClientViewProps> = ({ professionals, availability, onBookAppointment, onAdminAccess, isAuthenticated }) => {
    const [step, setStep] = useState(1); // 1: Select Professional, 2: Select Date/Time, 3: Enter Details, 4: Confirm
    const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');

    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

    const handleSelectProfessional = (professional: Professional) => {
        setSelectedProfessional(professional);
        setStep(2);
    };

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setSelectedTime(null);
    };
    
    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
        setStep(3);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
        
        if (value.length > 11) {
            value = value.slice(0, 11);
        }

        // Aplica a máscara XX XXXXX-XXXX
        if (value.length > 2) {
            value = value.replace(/^(\d{2})(\d)/, '$1 $2');
        }
        if (value.length > 8) { // Ajustado considerando o espaço adicionado
             value = value.replace(/^(\d{2})\s(\d{5})(\d)/, '$1 $2-$3');
        }
        
        setClientPhone(value);
    };
    
    const handleProceedToConfirm = () => {
        if (clientName.trim() && clientPhone.trim()) {
            setStep(4);
        } else {
            alert('Por favor, preencha seu nome e WhatsApp.');
        }
    };

    const handleConfirmBooking = () => {
        if (selectedProfessional && selectedDate && selectedTime && clientName && clientPhone) {
            onBookAppointment({
                professionalId: selectedProfessional.id,
                date: selectedDate.toISOString().split('T')[0],
                time: selectedTime,
            }, { name: clientName, phone: clientPhone });
            alert(`Agendamento com ${selectedProfessional.name} em ${selectedDate.toLocaleDateString('pt-BR')} às ${selectedTime} confirmado! Uma notificação foi enviada para o seu WhatsApp.`);
            reset();
        }
    };
    
    const reset = () => {
        setStep(1);
        setSelectedProfessional(null);
        setSelectedDate(null);
        setSelectedTime(null);
        setClientName('');
        setClientPhone('');
    }
    
    const handleSendChatMessage = (text: string) => {
        const newMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            sender: 'client',
            text,
            timestamp: new Date().toISOString()
        };
        setChatMessages(prev => [...prev, newMessage]);

        setTimeout(() => {
            const autoReply: ChatMessage = {
                id: `msg-${Date.now() + 1}`,
                sender: 'professional',
                text: 'Olá! Recebemos sua mensagem. Um de nossos instrutores responderá em breve.',
                timestamp: new Date().toISOString()
            };
            setChatMessages(prev => [...prev, autoReply]);
        }, 1000);
    };

    const professionalAvailability = selectedProfessional ? availability[selectedProfessional.id] || {} : {};
    const timesForSelectedDate = selectedDate ? professionalAvailability[selectedDate.toISOString().split('T')[0]] || [] : [];

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 flex flex-col">
            <div className="max-w-xl mx-auto flex-grow w-full">
                <header className="text-center mb-8 flex flex-col items-center">
                    <img src="https://igextreme.com.br/wp-content/uploads/2025/09/Design-sem-nome-13.png" alt="Igextreme Agendamento Logo" className="h-16 w-auto mb-4"/>
                    <p className="text-gray-500 mt-2">Agende seu horário com nossos profissionais</p>
                </header>

                <div className="bg-white rounded-xl shadow-2xl p-6 transition-all duration-500">
                    {step === 1 && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-700 mb-4">Escolha o Profissional</h2>
                            <div className="space-y-3">
                                {professionals.map(prof => (
                                    <button 
                                        key={prof.id} 
                                        onClick={() => handleSelectProfessional(prof)} 
                                        className="w-full flex items-center p-4 bg-white border border-gray-200 shadow-md hover:shadow-lg hover:bg-primary-light hover:border-primary-light rounded-xl transition-all duration-300"
                                    >
                                        <img src={prof.avatarUrl} alt={prof.name} className="w-12 h-12 rounded-full mr-4 shadow-sm"/>
                                        <span className="font-medium text-gray-800">{prof.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && selectedProfessional && (
                         <div>
                            <div className="flex items-center justify-between mb-4">
                                <button onClick={reset} className="text-sm text-primary-dark hover:underline">Trocar Profissional</button>
                                <div className="flex items-center">
                                    <img src={selectedProfessional.avatarUrl} alt={selectedProfessional.name} className="w-8 h-8 rounded-full mr-2"/>
                                    <span className="font-semibold">{selectedProfessional.name}</span>
                                </div>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-700 mb-4">Selecione a Data</h2>
                            <Calendar onDateSelect={handleDateSelect} selectedDate={selectedDate} availability={professionalAvailability} professionalId={selectedProfessional.id} />
                            
                            {selectedDate && (
                                <div className="mt-6">
                                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Horários Disponíveis</h2>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {timesForSelectedDate.length > 0 ? timesForSelectedDate.map(time => (
                                            <button key={time} onClick={() => handleTimeSelect(time)} className="p-3 bg-primary-light text-primary-dark font-semibold rounded-lg hover:bg-primary-dark hover:text-white transition-colors duration-200">
                                                {time}
                                            </button>
                                        )) : <p className="col-span-full text-gray-500">Nenhum horário disponível para esta data.</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-700 mb-4">Seus Dados</h2>
                            <p className="text-sm text-gray-500 mb-4">Precisamos dos seus dados para confirmar o agendamento.</p>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="client-name" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                                    <input type="text" id="client-name" value={clientName} onChange={e => setClientName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark sm:text-sm" placeholder="Seu nome"/>
                                </div>
                                <div>
                                    <label htmlFor="client-phone" className="block text-sm font-medium text-gray-700">WhatsApp</label>
                                    <input 
                                        type="tel" 
                                        id="client-phone" 
                                        value={clientPhone} 
                                        onChange={handlePhoneChange} 
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark sm:text-sm" 
                                        placeholder="XX XXXXX-XXXX"
                                        maxLength={13}
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                <button onClick={() => setStep(2)} className="w-full px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-colors">Voltar</button>
                                <button onClick={handleProceedToConfirm} className="w-full px-6 py-3 bg-primary-dark text-white font-bold rounded-lg hover:bg-yellow-600 transition-colors">Continuar</button>
                            </div>
                        </div>
                    )}
                    
                    {step === 4 && selectedProfessional && selectedDate && selectedTime && (
                        <div>
                           <div className="flex items-center justify-between mb-4">
                               <h2 className="text-xl font-semibold text-gray-700">Confirmar Agendamento</h2>
                           </div>
                           <div className="bg-primary-light/50 p-4 rounded-lg space-y-3 text-gray-700">
                               <p><strong className="font-semibold">Profissional:</strong> {selectedProfessional.name}</p>
                               <p><strong className="font-semibold">Data:</strong> {selectedDate.toLocaleDateString('pt-BR')}</p>
                               <p><strong className="font-semibold">Horário:</strong> {selectedTime}</p>
                               <hr className="border-primary-dark/20" />
                               <p><strong className="font-semibold">Nome:</strong> {clientName}</p>
                               <p><strong className="font-semibold">WhatsApp:</strong> {clientPhone}</p>
                           </div>
                           <div className="mt-6 flex flex-col sm:flex-row gap-3">
                               <button onClick={() => setStep(3)} className="w-full px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-colors">Voltar</button>
                               <button onClick={handleConfirmBooking} className="w-full px-6 py-3 bg-primary-dark text-white font-bold rounded-lg hover:bg-yellow-600 transition-colors">Confirmar e Agendar</button>
                           </div>
                        </div>
                    )}
                </div>
            </div>
            
            <footer className="mt-12 text-center text-gray-400 text-sm py-6">
                <button 
                    onClick={onAdminAccess} 
                    className="hover:text-primary-dark transition-colors focus:outline-none text-xs uppercase tracking-wider font-semibold"
                >
                    {isAuthenticated ? "Voltar para Painel Admin" : "Área do Profissional"}
                </button>
            </footer>

            <button
                onClick={() => setShowChat(true)}
                className="fixed bottom-6 right-6 bg-primary-dark text-white px-6 py-3 rounded-full shadow-lg hover:bg-yellow-600 transition-transform hover:scale-110 font-semibold"
                aria-label="Abrir chat"
            >
                Chat
            </button>
            {showChat && (
                <div className="fixed bottom-24 right-6 w-full max-w-sm h-3/5 z-20">
                    <ChatWindow
                        messages={chatMessages}
                        onSendMessage={handleSendChatMessage}
                        onClose={() => setShowChat(false)}
                        title="Fale com um Instrutor"
                    />
                </div>
            )}
        </div>
    );
};

export default ClientView;
