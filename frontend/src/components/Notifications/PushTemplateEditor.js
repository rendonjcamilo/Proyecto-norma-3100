import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Push Template Editor Component
 * Allows users to create and edit push notification templates
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import './PushTemplateEditor.css';
const COMMON_VARIABLES = [
    '{{name}}',
    '{{title}}',
    '{{message}}',
    '{{date}}',
    '{{organizationName}}',
    '{{status}}',
    '{{priority}}',
    '{{id}}',
];
export const PushTemplateEditor = ({ userId, onSave, templateId, }) => {
    const [template, setTemplate] = useState({
        name: '',
        title: '',
        body: '',
        variables: [],
    });
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [mode, setMode] = useState('list');
    useEffect(() => {
        fetchTemplates();
    }, [userId]);
    useEffect(() => {
        if (templateId && mode === 'edit') {
            fetchTemplate(templateId);
        }
    }, [templateId, mode]);
    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/multichannel/push/templates`, {
                headers: { 'x-user-id': userId },
            });
            setTemplates(response.data.templates || []);
        }
        catch (error) {
            console.error('Failed to fetch templates:', error);
            setMessage('Error cargando plantillas');
        }
        finally {
            setLoading(false);
        }
    };
    const fetchTemplate = async (id) => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/multichannel/push/templates/${id}`, {
                headers: { 'x-user-id': userId },
            });
            setTemplate(response.data.template);
        }
        catch (error) {
            console.error('Failed to fetch template:', error);
            setMessage('Error cargando plantilla');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSave = async () => {
        if (!template.name || !template.title || !template.body) {
            setMessage('❌ Completa todos los campos requeridos');
            return;
        }
        try {
            setSaving(true);
            const url = template.id
                ? `/api/multichannel/push/templates/${template.id}`
                : `/api/multichannel/push/templates`;
            const method = template.id ? 'put' : 'post';
            const response = await axios({
                method,
                url,
                data: template,
                headers: { 'x-user-id': userId },
            });
            setMessage('✅ Plantilla guardada correctamente');
            setTemplate(response.data.template);
            onSave?.(response.data.template);
            setTimeout(() => {
                setMessage('');
                setMode('list');
                fetchTemplates();
            }, 1500);
        }
        catch (error) {
            console.error('Failed to save template:', error);
            setMessage('❌ Error al guardar plantilla');
        }
        finally {
            setSaving(false);
        }
    };
    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
            return;
        }
        try {
            await axios.delete(`/api/multichannel/push/templates/${id}`, {
                headers: { 'x-user-id': userId },
            });
            setMessage('✅ Plantilla eliminada correctamente');
            setTimeout(() => {
                setMessage('');
                fetchTemplates();
            }, 1500);
        }
        catch (error) {
            console.error('Failed to delete template:', error);
            setMessage('❌ Error al eliminar plantilla');
        }
    };
    const insertVariable = (variable, field) => {
        if (field === 'title') {
            const input = document.getElementById('push-title');
            if (input) {
                const cursorPos = input.selectionStart || 0;
                const newTitle = template.title.substring(0, cursorPos) +
                    variable +
                    template.title.substring(cursorPos);
                setTemplate({ ...template, title: newTitle });
            }
        }
        else {
            const textarea = document.getElementById('push-body');
            if (textarea) {
                const cursorPos = textarea.selectionStart;
                const newBody = template.body.substring(0, cursorPos) +
                    variable +
                    template.body.substring(cursorPos);
                handleBodyChange(newBody);
            }
        }
    };
    const extractVariables = (text) => {
        const regex = /\{\{(\w+)\}\}/g;
        const matches = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            matches.push(match[0]);
        }
        return [...new Set(matches)];
    };
    const handleBodyChange = (value) => {
        const updatedTemplate = { ...template, body: value };
        const titleVars = extractVariables(template.title);
        const bodyVars = extractVariables(value);
        updatedTemplate.variables = [...new Set([...titleVars, ...bodyVars])];
        setTemplate(updatedTemplate);
    };
    const handleTitleChange = (value) => {
        const updatedTemplate = { ...template, title: value };
        const titleVars = extractVariables(value);
        const bodyVars = extractVariables(template.body);
        updatedTemplate.variables = [...new Set([...titleVars, ...bodyVars])];
        setTemplate(updatedTemplate);
    };
    if (loading && mode === 'list') {
        return _jsx("div", { className: "template-loading", children: "Cargando plantillas..." });
    }
    return (_jsxs("div", { className: "push-template-editor", children: [mode !== 'list' && (_jsxs("div", { className: "editor-header", children: [_jsx("button", { className: "back-button", onClick: () => {
                            setMode('list');
                            setTemplate({ name: '', title: '', body: '', variables: [] });
                        }, children: "\u2190 Volver a Plantillas" }), _jsx("h2", { children: mode === 'new' ? '🔔 Nueva Plantilla Push' : '🔔 Editar Plantilla Push' })] })), mode === 'list' && (_jsxs("div", { className: "templates-list", children: [_jsxs("div", { className: "list-header", children: [_jsx("h2", { children: "\uD83D\uDD14 Plantillas de Notificaciones Push" }), _jsx("button", { className: "btn btn-primary", onClick: () => {
                                    setTemplate({ name: '', title: '', body: '', variables: [] });
                                    setMode('new');
                                }, children: "+ Nueva Plantilla" })] }), templates.length === 0 ? (_jsxs("div", { className: "no-templates", children: [_jsx("p", { children: "No hay plantillas disponibles" }), _jsx("p", { children: "Crea tu primera plantilla para comenzar" })] })) : (_jsx("div", { className: "templates-grid", children: templates.map((tpl) => (_jsxs("div", { className: "template-card", children: [_jsx("h3", { children: tpl.name }), _jsxs("p", { className: "template-title", children: ["T\u00EDtulo: ", tpl.title] }), _jsxs("p", { className: "template-preview", children: [tpl.body.substring(0, 60), "..."] }), tpl.variables && tpl.variables.length > 0 && (_jsxs("div", { className: "template-variables", children: [tpl.variables.slice(0, 3).map((v, i) => (_jsx("span", { className: "variable-tag", children: v }, i))), tpl.variables.length > 3 && (_jsxs("span", { className: "variable-tag", children: ["+", tpl.variables.length - 3] }))] })), _jsxs("div", { className: "template-actions", children: [_jsx("button", { className: "btn btn-small btn-primary", onClick: () => {
                                                setTemplate(tpl);
                                                setMode('edit');
                                            }, children: "Editar" }), _jsx("button", { className: "btn btn-small btn-danger", onClick: () => tpl.id && handleDelete(tpl.id), children: "Eliminar" })] })] }, tpl.id))) }))] })), (mode === 'new' || mode === 'edit') && (_jsxs("div", { className: "template-editor", children: [_jsxs("div", { className: "editor-form", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Nombre de la Plantilla *" }), _jsx("input", { type: "text", value: template.name, onChange: (e) => setTemplate({ ...template, name: e.target.value }), placeholder: "ej: Bienvenida, Alerta Cr\u00EDtica, Recordatorio", className: "form-input" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "T\u00EDtulo de la Notificaci\u00F3n *" }), _jsxs("div", { className: "variables-toolbar", children: [_jsx("span", { className: "toolbar-label", children: "Variables:" }), COMMON_VARIABLES.map((variable) => (_jsx("button", { type: "button", className: "variable-button", onClick: () => insertVariable(variable, 'title'), children: variable }, variable)))] }), _jsx("input", { id: "push-title", type: "text", value: template.title, onChange: (e) => handleTitleChange(e.target.value), placeholder: "ej: {{organizationName}} - {{status}}", className: "form-input", maxLength: 65 }), _jsxs("small", { className: "field-hint", children: [template.title.length, "/65 caracteres"] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Cuerpo de la Notificaci\u00F3n *" }), _jsxs("div", { className: "variables-toolbar", children: [_jsx("span", { className: "toolbar-label", children: "Variables:" }), COMMON_VARIABLES.map((variable) => (_jsx("button", { type: "button", className: "variable-button", onClick: () => insertVariable(variable, 'body'), children: variable }, variable)))] }), _jsx("textarea", { id: "push-body", value: template.body, onChange: (e) => handleBodyChange(e.target.value), placeholder: "Escribe el contenido de la notificaci\u00F3n push... Usa {{variable}} para insertar variables din\u00E1micas", className: "form-textarea", rows: 6, maxLength: 240 }), _jsxs("small", { className: "field-hint", children: [template.body.length, "/240 caracteres"] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "URL de Acci\u00F3n (Opcional)" }), _jsx("input", { type: "url", value: template.actionUrl || '', onChange: (e) => setTemplate({ ...template, actionUrl: e.target.value }), placeholder: "https://ejemplo.com/path", className: "form-input" }), _jsx("small", { className: "field-hint", children: "URL a la que se dirigir\u00E1 al hacer clic en la notificaci\u00F3n" })] }), template.variables && template.variables.length > 0 && (_jsxs("div", { className: "detected-variables", children: [_jsx("h4", { children: "Variables Detectadas:" }), _jsx("div", { className: "variables-list", children: template.variables.map((v, i) => (_jsx("span", { className: "variable-tag", children: v }, i))) })] })), _jsxs("div", { className: "editor-actions", children: [_jsx("button", { className: "btn btn-primary", onClick: handleSave, disabled: saving, children: saving ? 'Guardando...' : '💾 Guardar Plantilla' }), _jsx("button", { type: "button", className: "btn btn-secondary", onClick: () => setShowPreview(!showPreview), children: showPreview ? '👁️ Ocultar Vista Previa' : '👁️ Vista Previa' }), template.id && (_jsx("button", { type: "button", className: "btn btn-danger", onClick: () => template.id && handleDelete(template.id), children: "\uD83D\uDDD1\uFE0F Eliminar" }))] })] }), showPreview && (_jsxs("div", { className: "editor-preview", children: [_jsx("div", { className: "preview-header", children: _jsx("h3", { children: "Vista Previa del Push" }) }), _jsx("div", { className: "preview-content", children: _jsxs("div", { className: "mobile-mockup", children: [_jsx("div", { className: "mockup-status-bar", children: "\uD83D\uDCF1 14:35" }), _jsxs("div", { className: "mockup-notification", children: [_jsx("div", { className: "notification-icon", children: "\uD83D\uDD14" }), _jsxs("div", { className: "notification-content", children: [_jsx("div", { className: "notification-title", children: template.title || '(sin título)' }), _jsx("div", { className: "notification-body", children: template.body || '(sin contenido)' })] })] }), _jsx("div", { className: "mockup-screen", children: _jsx("div", { className: "screen-content", children: _jsx("p", { children: "Contenido de la aplicaci\u00F3n..." }) }) })] }) }), _jsx("div", { className: "preview-footer", children: _jsx("p", { className: "info-text", children: !template.title && !template.body
                                        ? 'Completa el título y cuerpo para ver la vista previa'
                                        : template.actionUrl
                                            ? `✅ Dirigirá a: ${template.actionUrl}`
                                            : 'ℹ️ Sin URL de acción configurada' }) })] }))] })), message && _jsx("div", { className: "editor-message", children: message })] }));
};
//# sourceMappingURL=PushTemplateEditor.js.map