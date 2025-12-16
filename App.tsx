import React, { useState, useEffect, useCallback } from 'react';
import type { Professional, Client, Availability, Appointment, WhatsappConfig, MessageTemplates, ChatMessage, ClientFile, WebhookConfig } from './types';
import ClientView from './components/ClientView';
import AdminView from './components/AdminView';
import AdminLogin from './components/AdminLogin';
import { supabase } from './supabaseClient';

// --- INITIAL EMPTY STATES ---
const initialWhatsappConfig: WhatsappConfig = {
    url: '',
    token: '',
    instance: ''
};

const initialMessageTemplates: MessageTemplates = {
    booking: 'Olá {cliente}, seu agendamento com {profissional} para o dia {data} às {hora} está pré-reservado. Confirme para garantir seu horário.',
    confirmation: 'Olá {cliente}! Seu agendamento com {profissional} no dia {data} às {hora} foi confirmado com sucesso.',
    reminder: 'Olá {cliente}, este é um lembrete do seu treino com {profissional} amanhã ({data}) às {hora}. Te esperamos!',
    cancellation: 'Olá {cliente}, informamos que seu agendamento com {profissional} para o dia {data} às {hora} foi cancelado. Entre em contato para remarcar.'
};

const initialWebhookConfig: WebhookConfig = {
    bookingUrl: '',
    cancellationUrl: '',
    headers: {},
    format: 'STANDARD_JSON'
};

function App() {
    // States: 'client', 'login', 'admin'
    const [currentView, setCurrentView] = useState<'client' | 'login' | 'admin'>('client');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [availability, setAvailability] = useState<{ [key: string]: Availability }>({});
    
    const [whatsappConfig, setWhatsappConfig] = useState<WhatsappConfig>(initialWhatsappConfig);
    const [messageTemplates, setMessageTemplates] = useState<MessageTemplates>(initialMessageTemplates);
    const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>(initialWebhookConfig);

    // --- DATA FETCHING ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 0. Validate Supabase Configuration (Client-side check)
            // @ts-ignore
            if (supabase.supabaseUrl && supabase.supabaseUrl.includes('sua-url-do-projeto')) {
                throw new Error("CONFIGURAÇÃO NECESSÁRIA: Edite o arquivo 'supabaseClient.ts' com sua URL e Chave do Supabase.");
            }

            // 1. Fetch Professionals
            const { data: profData, error: profError } = await supabase.from('professionals').select('*');
            if (profError) throw new Error(`Erro Profissionais: ${profError.message}`);
            setProfessionals(profData || []);

            // 2. Fetch Availability
            const { data: availData, error: availError } = await supabase.from('availability').select('*');
            if (availError) throw new Error(`Erro Disponibilidade: ${availError.message}`);
            
            const availMap: { [key: string]: Availability } = {};
            availData?.forEach((row: any) => {
                if (!availMap[row.professional_id]) availMap[row.professional_id] = {};
                availMap[row.professional_id][row.date] = row.times;
            });
            setAvailability(availMap);

            // 3. Fetch Settings (Whatsapp, Templates, Webhooks)
            const { data: settingsData, error: settingsError } = await supabase.from('settings').select('*');
            // Settings might be empty initially, allow it.
            if (settingsError) console.warn("Aviso Configurações:", settingsError.message);

            if (settingsData) {
                settingsData.forEach(setting => {
                    if (setting.key === 'whatsapp_config') setWhatsappConfig(setting.value);
                    if (setting.key === 'message_templates') setMessageTemplates(setting.value);
                    if (setting.key === 'webhook_config') setWebhookConfig(setting.value);
                });
            }

            // 4. Fetch Clients & Appointments (Full Hierarchical Load)
            // Fetch basic client data
            const { data: clientData, error: clientError } = await supabase.from('clients').select('*');
            if (clientError) throw new Error(`Erro Clientes: ${clientError.message}`);

            if (clientData) {
                const loadedClients: Client[] = [];
                
                for (const c of clientData) {
                    // Fetch Appointments
                    const { data: apps, error: appError } = await supabase
                        .from('appointments')
                        .select('*')
                        .eq('client_id', c.id);
                    
                    if (appError) console.warn(`Erro Agendamentos (Cliente ${c.id}):`, appError.message);

                    // Fetch Messages
                    const { data: msgs, error: msgError } = await supabase
                        .from('chat_messages')
                        .select('*')
                        .eq('client_id', c.id);
                    
                    // Fetch Files
                    const { data: files, error: fileError } = await supabase
                        .from('client_files')
                        .select('*')
                        .eq('client_id', c.id);

                    loadedClients.push({
                        id: c.id,
                        name: c.name,
                        phone: c.phone,
                        appointments: (apps || []).map((a: any) => ({
                            id: a.id,
                            clientId: a.client_id,
                            professionalId: a.professional_id,
                            date: a.date,
                            time: a.time
                        })),
                        chatHistory: (msgs || []).map((m: any) => ({
                            id: m.id,
                            sender: m.sender,
                            text: m.text,
                            timestamp: m.timestamp
                        })),
                        files: (files || []).map((f: any) => ({
                            id: f.id,
                            name: f.name,
                            url: f.url,
                            type: f.type,
                            uploadedAt: f.uploaded_at
                        }))
                    });
                }
                setClients(loadedClients);
            }

        } catch (error: any) {
            // Improved error logging
            const errorMsg = error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
            console.error("Erro ao carregar dados do Supabase:", errorMsg);
            
            // Show alert only for critical setup errors
            if (errorMsg.includes('sua-url-do-projeto') || errorMsg.includes('CONFIGURAÇÃO NECESSÁRIA')) {
                alert(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- ACTIONS ---

    // Função auxiliar para enviar mensagem via API
    const sendWhatsappMessage = async (phone: string, message: string) => {
        if (!whatsappConfig.url || !whatsappConfig.token || !whatsappConfig.instance) {
            console.warn("Configuração do WhatsApp incompleta.");
            return;
        }

        let baseUrl = whatsappConfig.url.trim().replace(/\/$/, '');
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
            baseUrl = `https://${baseUrl}`;
        }

        if (window.location.protocol === 'https:' && baseUrl.startsWith('http:')) {
             alert(`ERRO DE SEGURANÇA (Mixed Content). Use HTTPS na API do WhatsApp.`);
             return;
        }

        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
            cleanPhone = '55' + cleanPhone;
        }

        try {
            const endpoint = `${baseUrl}/message/sendText/${whatsappConfig.instance}`;
            await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': whatsappConfig.token 
                },
                body: JSON.stringify({
                    number: cleanPhone,
                    options: { delay: 1200, presence: "composing", linkPreview: false },
                    textMessage: { text: message }
                })
            });
            console.log("WhatsApp enviado para", cleanPhone);
        } catch (error: any) {
            console.error("Erro detalhado WhatsApp:", error);
        }
    };

    // Função para disparar Webhooks
    const triggerWebhook = async (url: string, rawData: any) => {
        if (!url) return;
        let targetUrl = url.trim();
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = `https://${targetUrl}`;
        }
        if (window.location.protocol === 'https:' && targetUrl.startsWith('http:')) {
             console.error("Bloqueio de Mixed Content");
             return;
        }

        try {
            const headers: HeadersInit = { 'Content-Type': 'application/json', ...webhookConfig.headers };
            let bodyPayload = {};

            if (webhookConfig.format === 'EVOLUTION_API_TEXT') {
                let phone = '';
                let text = '';

                if (rawData.event === 'booking_created') {
                    phone = rawData.client?.phone || '';
                    text = `Novo agendamento: ${rawData.client?.name} com ${rawData.appointment?.professionalName} dia ${rawData.appointment?.formattedDate}`;
                } else if (rawData.event === 'booking_cancelled') {
                    phone = rawData.client?.phone || '';
                    text = `Agendamento cancelado: ${rawData.client?.name}`;
                } else if (rawData.event?.startsWith('test')) {
                    phone = '5511999999999';
                    text = rawData.message || 'Teste Webhook';
                }
                phone = phone.replace(/\D/g, '');
                if (phone.length >= 10 && phone.length <= 11) phone = '55' + phone;

                bodyPayload = {
                    number: phone,
                    options: { delay: 1000, presence: "composing", linkPreview: false },
                    textMessage: { text: text }
                };
            } else {
                bodyPayload = rawData;
            }

            await fetch(targetUrl, { method: 'POST', headers: headers, body: JSON.stringify(bodyPayload) });
        } catch (error: any) {
            console.error("Falha ao disparar webhook:", error);
        }
    };

    const handleBookAppointment = async (
        appointmentData: Omit<Appointment, 'id' | 'clientId'>,
        clientInfo: { name: string; phone: string }
    ) => {
        try {
            // 1. Find or Create Client
            let clientId = '';
            const { data: existingClient, error: searchError } = await supabase
                .from('clients')
                .select('id')
                .eq('phone', clientInfo.phone)
                .single();
            
            if (searchError && searchError.code !== 'PGRST116') { // PGRST116 is 'not found' which is fine
                 throw searchError;
            }

            if (existingClient) {
                clientId = existingClient.id;
            } else {
                const { data: newClient, error: createError } = await supabase
                    .from('clients')
                    .insert([{ name: clientInfo.name, phone: clientInfo.phone }])
                    .select()
                    .single();
                
                if (createError) throw createError;
                clientId = newClient.id;
            }

            // 2. Create Appointment
            const { data: newApp, error: appError } = await supabase
                .from('appointments')
                .insert([{
                    client_id: clientId,
                    professional_id: appointmentData.professionalId,
                    date: appointmentData.date,
                    time: appointmentData.time
                }])
                .select()
                .single();

            if (appError) throw appError;

            // 3. Notifications
            const professional = professionals.find(p => p.id === appointmentData.professionalId);
            const profName = professional ? professional.name : 'Profissional';
            const formattedDate = new Date(appointmentData.date + 'T00:00:00').toLocaleDateString('pt-BR');

            if (professional) {
                let msg = messageTemplates.confirmation
                    .replace('{cliente}', clientInfo.name)
                    .replace('{profissional}', profName)
                    .replace('{data}', formattedDate)
                    .replace('{hora}', appointmentData.time);
                
                sendWhatsappMessage(clientInfo.phone, msg);
            }

            triggerWebhook(webhookConfig.bookingUrl, {
                event: 'booking_created',
                client: clientInfo,
                appointment: {
                    ...newApp,
                    professionalName: profName,
                    formattedDate
                },
                timestamp: new Date().toISOString()
            });

            await fetchData(); // Refresh local state
            alert("Agendamento realizado com sucesso!");

        } catch (err: any) {
            console.error(err);
            alert("Erro ao realizar agendamento: " + (err.message || String(err)));
        }
    };

    const handleAddProfessional = async (name: string) => {
        try {
            const { error } = await supabase.from('professionals').insert([{ 
                name, 
                avatar_url: `https://picsum.photos/seed/${name}/100/100` 
            }]);
            if (error) throw error;
            fetchData();
        } catch (err: any) { alert("Erro ao adicionar profissional: " + err.message); }
    };

    const handleUpdateProfessional = async (updatedProfessional: Professional) => {
        try {
            const { error } = await supabase.from('professionals')
                .update({ name: updatedProfessional.name, avatar_url: updatedProfessional.avatarUrl })
                .eq('id', updatedProfessional.id);
            if (error) throw error;
            fetchData();
        } catch (err: any) { alert("Erro ao atualizar profissional: " + err.message); }
    };

    const handleDeleteProfessional = async (professionalId: string) => {
        if (!confirm("Tem certeza? Isso apagará agendamentos e disponibilidade deste profissional.")) return;
        try {
            // Delete constraints manually if cascading is not set up, 
            // but assuming basic cascading or manual cleanup:
            await supabase.from('availability').delete().eq('professional_id', professionalId);
            await supabase.from('appointments').delete().eq('professional_id', professionalId);
            const { error } = await supabase.from('professionals').delete().eq('id', professionalId);
            if (error) throw error;
            fetchData();
        } catch (err: any) { alert("Erro ao excluir profissional: " + err.message); }
    };

    const handleUpdateAvailability = async (professionalId: string, date: string, times: string[]) => {
        try {
            // Using UPSERT based on unique constraint (professional_id, date)
            const { error } = await supabase.from('availability').upsert({
                professional_id: professionalId,
                date: date,
                times: times
            }, { onConflict: 'professional_id, date' });
            
            if (error) throw error;
            
            // Optimistic update
            setAvailability(prev => ({
                ...prev,
                [professionalId]: {
                    ...prev[professionalId],
                    [date]: times
                }
            }));
        } catch (err: any) { alert("Erro ao salvar agenda: " + err.message); }
    };

    const handleSendMessage = async (clientId: string, message: ChatMessage) => {
        try {
            const { error } = await supabase.from('chat_messages').insert([{
                client_id: clientId,
                sender: message.sender,
                text: message.text,
                timestamp: message.timestamp
            }]);
            if (error) throw error;
            fetchData(); // Simplest way to sync
        } catch (err: any) { alert("Erro ao salvar mensagem: " + err.message); }
    };

    const handleAddFile = async (clientId: string, file: ClientFile) => {
        try {
            // In a real scenario, you'd upload to Supabase Storage here and get the URL.
            // For now, we are just saving the metadata record as the mock did.
            const { error } = await supabase.from('client_files').insert([{
                client_id: clientId,
                name: file.name,
                url: file.url,
                type: file.type,
                uploaded_at: file.uploadedAt
            }]);
            if (error) throw error;
            fetchData();
        } catch (err: any) { alert("Erro ao salvar arquivo: " + err.message); }
    };

    const handleSendReminder = (clientId: string, appointment: Appointment) => {
        const client = clients.find(c => c.id === clientId);
        const professional = professionals.find(p => p.id === appointment.professionalId);
        
        if (client && professional) {
            let msg = messageTemplates.reminder
                .replace('{cliente}', client.name)
                .replace('{profissional}', professional.name)
                .replace('{data}', new Date(appointment.date + 'T00:00:00').toLocaleDateString('pt-BR'))
                .replace('{hora}', appointment.time);
            
            sendWhatsappMessage(client.phone, msg);
            alert(`Lembrete enviado para a fila de disparo (Cliente: ${client.name})`);
        }
    };

    const handleCancelAppointment = async (clientId: string, appointmentId: string) => {
        const client = clients.find(c => c.id === clientId);
        const appointment = client?.appointments.find(a => a.id === appointmentId);
        const professional = professionals.find(p => p.id === appointment?.professionalId);

        try {
            // 1. Delete from DB
            const { error } = await supabase.from('appointments').delete().eq('id', appointmentId);
            if (error) throw error;

            // 2. Notifications
            if (client && appointment && professional) {
                let msg = messageTemplates.cancellation
                    .replace('{cliente}', client.name)
                    .replace('{profissional}', professional.name)
                    .replace('{data}', new Date(appointment.date + 'T00:00:00').toLocaleDateString('pt-BR'))
                    .replace('{hora}', appointment.time);
                
                sendWhatsappMessage(client.phone, msg);

                triggerWebhook(webhookConfig.cancellationUrl, {
                    event: 'booking_cancelled',
                    client: { name: client.name, phone: client.phone },
                    appointmentId: appointmentId,
                    reason: 'Cancelled by Admin',
                    timestamp: new Date().toISOString()
                });
            }

            alert("Agendamento cancelado.");
            fetchData();

        } catch (err: any) { alert("Erro ao cancelar agendamento: " + err.message); }
    };

    // --- SETTINGS PERSISTENCE ---
    const updateSettings = async (key: string, value: any) => {
        try {
            await supabase.from('settings').upsert({ key, value });
        } catch (err) { console.error("Erro ao salvar configuração", err); }
    };

    const updateWhatsappConfig = (cfg: WhatsappConfig) => {
        setWhatsappConfig(cfg);
        updateSettings('whatsapp_config', cfg);
    };

    const updateMessageTemplates = (tpl: MessageTemplates) => {
        setMessageTemplates(tpl);
        updateSettings('message_templates', tpl);
    };

    const updateWebhookConfig = (cfg: WebhookConfig) => {
        setWebhookConfig(cfg);
        updateSettings('webhook_config', cfg);
    };

    const handleAdminAccess = () => {
        if (isAuthenticated) {
            setCurrentView('admin');
        } else {
            setCurrentView('login');
        }
    };

    if (loading && professionals.length === 0) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Carregando sistema...</div>;
    }

    return (
        <div className="h-full">
            {currentView === 'client' && (
                <ClientView
                    professionals={professionals}
                    availability={availability}
                    onBookAppointment={handleBookAppointment}
                    onAdminAccess={handleAdminAccess}
                    isAuthenticated={isAuthenticated}
                />
            )}

            {currentView === 'login' && (
                <AdminLogin 
                    onLogin={() => {
                        setIsAuthenticated(true);
                        setCurrentView('admin');
                    }}
                    onBack={() => setCurrentView('client')}
                />
            )}

            {currentView === 'admin' && (
                <AdminView
                    professionals={professionals}
                    clients={clients}
                    availability={availability}
                    whatsappConfig={whatsappConfig}
                    messageTemplates={messageTemplates}
                    webhookConfig={webhookConfig}
                    onUpdateAvailability={handleUpdateAvailability}
                    onAddProfessional={handleAddProfessional}
                    onDeleteProfessional={handleDeleteProfessional}
                    onUpdateProfessional={handleUpdateProfessional}
                    onUpdateWhatsappConfig={updateWhatsappConfig}
                    onUpdateMessageTemplates={updateMessageTemplates}
                    onUpdateWebhookConfig={updateWebhookConfig}
                    onTriggerTestWebhook={triggerWebhook}
                    onSendMessage={handleSendMessage}
                    onAddFile={handleAddFile}
                    onGoToClient={() => setCurrentView('client')}
                    onSendReminder={handleSendReminder}
                    onCancelAppointment={handleCancelAppointment}
                />
            )}
        </div>
    );
}

export default App;