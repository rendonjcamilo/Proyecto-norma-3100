import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Email Template Editor Component
 * Allows users to create and edit email notification templates
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import './EmailTemplateEditor.css';
const COMMON_VARIABLES = [
    '{{name}}',
    '{{email}}',
    '{{date}}',
    '{{time}}',
    '{{organizationName}}',
    '{{findingTitle}}',
    '{{status}}',
    '{{priority}}',
];
export const EmailTemplateEditor = ({ userId, onSave, templateId, }) => {
    const [template, setTemplate] = useState({
        name: '',
        subject: '',
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
            const response = await axios.get(`/api/multichannel/email/templates`, {
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
            const response = await axios.get(`/api/multichannel/email/templates/${id}`, {
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
        if (!template.name || !template.subject || !template.body) {
            setMessage('❌ Completa todos los campos requeridos');
            return;
        }
        try {
            setSaving(true);
            const url = template.id
                ? `/api/multichannel/email/templates/${template.id}`
                : `/api/multichannel/email/templates`;
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
            await axios.delete(`/api/multichannel/email/templates/${id}`, {
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
    const insertVariable = (variable) => {
        const textarea = document.getElementById('template-body');
        if (textarea) {
            const cursorPos = textarea.selectionStart;
            const newBody = template.body.substring(0, cursorPos) +
                variable +
                template.body.substring(cursorPos);
            setTemplate({ ...template, body: newBody });
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
        updatedTemplate.variables = extractVariables(value);
        setTemplate(updatedTemplate);
    };
    if (loading && mode === 'list') {
        return _jsx("div", { className: "template-loading", children: "Cargando plantillas..." });
    }
    return (_jsxs("div", { className: "email-template-editor", children: [mode !== 'list' && (_jsxs("div", { className: "editor-header", children: [_jsx("button", { className: "back-button", onClick: () => {
                            setMode('list');
                            setTemplate({ name: '', subject: '', body: '', variables: [] });
                        }, children: "\u2190 Volver a Plantillas" }), _jsx("h2", { children: mode === 'new' ? '📧 Nueva Plantilla Email' : '📧 Editar Plantilla Email' })] })), mode === 'list' && (_jsxs("div", { className: "templates-list", children: [_jsxs("div", { className: "list-header", children: [_jsx("h2", { children: "\uD83D\uDCE7 Plantillas de Email" }), _jsx("button", { className: "btn btn-primary", onClick: () => {
                                    setTemplate({ name: '', subject: '', body: '', variables: [] });
                                    setMode('new');
                                }, children: "+ Nueva Plantilla" })] }), templates.length === 0 ? (_jsxs("div", { className: "no-templates", children: [_jsx("p", { children: "No hay plantillas disponibles" }), _jsx("p", { children: "Crea tu primera plantilla para comenzar" })] })) : (_jsx("div", { className: "templates-grid", children: templates.map((tpl) => (_jsxs("div", { className: "template-card", children: [_jsx("h3", { children: tpl.name }), _jsxs("p", { className: "template-subject", children: ["Asunto: ", tpl.subject] }), _jsxs("p", { className: "template-preview", children: [tpl.body.substring(0, 80), "..."] }), tpl.variables && tpl.variables.length > 0 && (_jsxs("div", { className: "template-variables", children: [tpl.variables.slice(0, 3).map((v, i) => (_jsx("span", { className: "variable-tag", children: v }, i))), tpl.variables.length > 3 && (_jsxs("span", { className: "variable-tag", children: ["+", tpl.variables.length - 3] }))] })), _jsxs("div", { className: "template-actions", children: [_jsx("button", { className: "btn btn-small btn-primary", onClick: () => {
                                                setTemplate(tpl);
                                                setMode('edit');
                                            }, children: "Editar" }), _jsx("button", { className: "btn btn-small btn-danger", onClick: () => tpl.id && handleDelete(tpl.id), children: "Eliminar" })] })] }, tpl.id))) }))] })), (mode === 'new' || mode === 'edit') && (_jsxs("div", { className: "template-editor", children: [_jsxs("div", { className: "editor-form", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Nombre de la Plantilla *" }), _jsx("input", { type: "text", value: template.name, onChange: (e) => setTemplate({ ...template, name: e.target.value }), placeholder: "ej: Bienvenida, Confirmaci\u00F3n, Alerta", className: "form-input" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Asunto del Email *" }), _jsx("input", { type: "text", value: template.subject, onChange: (e) => setTemplate({ ...template, subject: e.target.value }), placeholder: "ej: Bienvenido a {{organizationName}}", className: "form-input" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Cuerpo del Email *" }), _jsxs("div", { className: "variables-toolbar", children: [_jsx("span", { className: "toolbar-label", children: "Variables disponibles:" }), COMMON_VARIABLES.map((variable) => (_jsx("button", { type: "button", className: "variable-button", onClick: () => insertVariable(variable), children: variable }, variable)))] }), _jsx("textarea", { id: "template-body", value: template.body, onChange: (e) => handleBodyChange(e.target.value), placeholder: "Escribe el contenido del email aqu\u00ED... Usa {{variable}} para insertar variables din\u00E1micas", className: "form-textarea", rows: 12 })] }), template.variables && template.variables.length > 0 && (_jsxs("div", { className: "detected-variables", children: [_jsx("h4", { children: "Variables Detectadas:" }), _jsx("div", { className: "variables-list", children: template.variables.map((v, i) => (_jsx("span", { className: "variable-tag", children: v }, i))) })] })), _jsxs("div", { className: "editor-actions", children: [_jsx("button", { className: "btn btn-primary", onClick: handleSave, disabled: saving, children: saving ? 'Guardando...' : '💾 Guardar Plantilla' }), _jsx("button", { type: "button", className: "btn btn-secondary", onClick: () => setShowPreview(!showPreview), children: showPreview ? '👁️ Ocultar Vista Previa' : '👁️ Vista Previa' }), template.id && (_jsx("button", { type: "button", className: "btn btn-danger", onClick: () => template.id && handleDelete(template.id), children: "\uD83D\uDDD1\uFE0F Eliminar" }))] })] }), showPreview && (_jsxs("div", { className: "editor-preview", children: [_jsx("div", { className: "preview-header", children: _jsx("h3", { children: "Vista Previa del Email" }) }), _jsxs("div", { className: "preview-content", children: [_jsxs("div", { className: "preview-subject", children: [_jsx("strong", { children: "Asunto:" }), " ", template.subject || '(sin asunto)'] }), _jsx("div", { className: "preview-body", children: template.body || '(sin contenido)' })] })] }))] })), message && _jsx("div", { className: "editor-message", children: message })] }));
};
//# sourceMappingURL=EmailTemplateEditor.js.map