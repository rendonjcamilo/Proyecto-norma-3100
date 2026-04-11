import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Multi-Channel Notification Preferences Component
 * Allows users to configure email, SMS, and push notification settings
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import './MultiChannelPreferences.css';
export const MultiChannelPreferences = ({ userId, onSave, }) => {
    const [preferences, setPreferences] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('email');
    useEffect(() => {
        fetchPreferences();
    }, [userId]);
    const fetchPreferences = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/notifications/channels/preferences`, {
                headers: {
                    'x-user-id': userId,
                },
            });
            setPreferences(response.data);
            setMessage('');
        }
        catch (error) {
            console.error('Failed to fetch preferences:', error);
            setMessage('Error cargando preferencias');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSave = async () => {
        if (!preferences)
            return;
        try {
            setSaving(true);
            await axios.put(`/api/notifications/channels/preferences`, preferences, {
                headers: {
                    'x-user-id': userId,
                },
            });
            setMessage('✅ Preferencias guardadas correctamente');
            onSave?.(preferences);
            setTimeout(() => setMessage(''), 3000);
        }
        catch (error) {
            console.error('Failed to save preferences:', error);
            setMessage('❌ Error al guardar preferencias');
        }
        finally {
            setSaving(false);
        }
    };
    const updatePreference = (key, value) => {
        setPreferences((prev) => prev ? { ...prev, [key]: value } : null);
    };
    if (loading) {
        return _jsx("div", { className: "preferences-loading", children: "Cargando preferencias..." });
    }
    if (!preferences) {
        return _jsx("div", { className: "preferences-error", children: "No se pudieron cargar las preferencias" });
    }
    return (_jsxs("div", { className: "multichannel-preferences", children: [_jsxs("div", { className: "preferences-header", children: [_jsx("h2", { children: "Preferencias de Notificaciones" }), _jsx("p", { children: "Configura c\u00F3mo deseas recibir notificaciones en cada canal" })] }), _jsxs("div", { className: "preferences-tabs", children: [_jsx("button", { className: `tab-button ${activeTab === 'email' ? 'active' : ''}`, onClick: () => setActiveTab('email'), children: "\uD83D\uDCE7 Email" }), _jsx("button", { className: `tab-button ${activeTab === 'sms' ? 'active' : ''}`, onClick: () => setActiveTab('sms'), children: "\uD83D\uDCAC SMS" }), _jsx("button", { className: `tab-button ${activeTab === 'push' ? 'active' : ''}`, onClick: () => setActiveTab('push'), children: "\uD83D\uDD14 Push" })] }), _jsxs("div", { className: "preferences-content", children: [activeTab === 'email' && (_jsxs("div", { className: "preference-section", children: [_jsx("h3", { children: "Preferencias de Email" }), _jsx("div", { className: "preference-group", children: _jsxs("label", { className: "checkbox-label", children: [_jsx("input", { type: "checkbox", checked: preferences.emailEnabled, onChange: (e) => updatePreference('emailEnabled', e.target.checked) }), _jsx("span", { children: "Habilitar notificaciones por email" })] }) }), preferences.emailEnabled && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "preference-group", children: [_jsx("label", { children: "Direcci\u00F3n de correo:" }), _jsx("input", { type: "email", value: preferences.emailAddress || '', onChange: (e) => updatePreference('emailAddress', e.target.value), placeholder: "correo@example.com" }), preferences.emailVerified && (_jsx("span", { className: "verified-badge", children: "\u2713 Verificado" }))] }), _jsxs("div", { className: "preference-group", children: [_jsx("label", { children: "Horas silenciosas (opcional):" }), _jsxs("div", { className: "time-range", children: [_jsx("input", { type: "time", value: preferences.emailQuietHoursStart || '', onChange: (e) => updatePreference('emailQuietHoursStart', e.target.value), placeholder: "Inicio" }), _jsx("span", { children: "a" }), _jsx("input", { type: "time", value: preferences.emailQuietHoursEnd || '', onChange: (e) => updatePreference('emailQuietHoursEnd', e.target.value), placeholder: "Fin" })] }), _jsx("small", { children: "No recibir\u00E1s notificaciones en este rango horario" })] })] }))] })), activeTab === 'sms' && (_jsxs("div", { className: "preference-section", children: [_jsx("h3", { children: "Preferencias de SMS" }), _jsx("div", { className: "preference-group", children: _jsxs("label", { className: "checkbox-label", children: [_jsx("input", { type: "checkbox", checked: preferences.smsEnabled, onChange: (e) => updatePreference('smsEnabled', e.target.checked) }), _jsx("span", { children: "Habilitar notificaciones por SMS" })] }) }), preferences.smsEnabled && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "preference-group", children: [_jsx("label", { children: "N\u00FAmero de tel\u00E9fono:" }), _jsx("input", { type: "tel", value: preferences.phoneNumber || '', onChange: (e) => updatePreference('phoneNumber', e.target.value), placeholder: "+573001234567" }), preferences.smsVerified && (_jsx("span", { className: "verified-badge", children: "\u2713 Verificado" }))] }), _jsxs("div", { className: "preference-group", children: [_jsx("label", { children: "Horas silenciosas (opcional):" }), _jsxs("div", { className: "time-range", children: [_jsx("input", { type: "time", value: preferences.smsQuietHoursStart || '', onChange: (e) => updatePreference('smsQuietHoursStart', e.target.value), placeholder: "Inicio" }), _jsx("span", { children: "a" }), _jsx("input", { type: "time", value: preferences.smsQuietHoursEnd || '', onChange: (e) => updatePreference('smsQuietHoursEnd', e.target.value), placeholder: "Fin" })] }), _jsx("small", { children: "No recibir\u00E1s SMS en este rango horario" })] })] }))] })), activeTab === 'push' && (_jsxs("div", { className: "preference-section", children: [_jsx("h3", { children: "Preferencias de Notificaciones Push" }), _jsx("div", { className: "preference-group", children: _jsxs("label", { className: "checkbox-label", children: [_jsx("input", { type: "checkbox", checked: preferences.pushEnabled, onChange: (e) => updatePreference('pushEnabled', e.target.checked) }), _jsx("span", { children: "Habilitar notificaciones push" })] }) }), preferences.pushEnabled && (_jsxs("div", { className: "preference-group", children: [_jsx("label", { children: "Horas silenciosas (opcional):" }), _jsxs("div", { className: "time-range", children: [_jsx("input", { type: "time", value: preferences.pushQuietHoursStart || '', onChange: (e) => updatePreference('pushQuietHoursStart', e.target.value), placeholder: "Inicio" }), _jsx("span", { children: "a" }), _jsx("input", { type: "time", value: preferences.pushQuietHoursEnd || '', onChange: (e) => updatePreference('pushQuietHoursEnd', e.target.value), placeholder: "Fin" })] }), _jsx("small", { children: "No recibir\u00E1s notificaciones push en este rango horario" })] }))] }))] }), message && _jsx("div", { className: "preferences-message", children: message }), _jsxs("div", { className: "preferences-actions", children: [_jsx("button", { className: "btn btn-primary", onClick: handleSave, disabled: saving, children: saving ? 'Guardando...' : 'Guardar Cambios' }), _jsx("button", { className: "btn btn-secondary", onClick: fetchPreferences, children: "Descartar Cambios" })] })] }));
};
//# sourceMappingURL=MultiChannelPreferences.js.map