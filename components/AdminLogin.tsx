
import React, { useState } from 'react';

interface AdminLoginProps {
    onLogin: () => void;
    onBack: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBack }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!username || !password) {
            setError('Por favor, preencha todos os campos.');
            return;
        }

        // Verificação de credenciais específicas
        if (username === 'IGExtreme_admin' && password === '#igextreme#2025') {
            setError('');
            onLogin();
        } else {
            setError('Usuário ou senha incorretos.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <div className="text-center mb-8">
                    <img 
                        src="https://igextreme.com.br/wp-content/uploads/2025/09/Design-sem-nome-13.png" 
                        alt="Igextreme Logo" 
                        className="h-20 w-auto mx-auto mb-4"
                    />
                    <h2 className="text-2xl font-bold text-gray-800">Acesso Administrativo</h2>
                    <p className="text-gray-500 text-sm mt-1">Entre com suas credenciais para gerenciar</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-100 border border-red-200 text-red-600 text-sm rounded-lg">
                            {error}
                        </div>
                    )}
                    
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Login</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-700 text-white placeholder-white focus:ring-2 focus:ring-primary-dark focus:border-transparent outline-none transition-all"
                            placeholder="Usuário"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-700 text-white placeholder-white focus:ring-2 focus:ring-primary-dark focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-primary-dark hover:bg-yellow-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                        Entrar no Sistema
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button 
                        onClick={onBack}
                        className="text-sm text-gray-500 hover:text-primary-dark transition-colors"
                    >
                        &larr; Voltar para agendamento
                    </button>
                </div>
            </div>
            <p className="mt-8 text-gray-400 text-xs">
                &copy; 2025 Igextreme Agendamento. Todos os direitos reservados.
            </p>
        </div>
    );
};

export default AdminLogin;
