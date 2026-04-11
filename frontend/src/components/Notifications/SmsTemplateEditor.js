import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SMS Template Editor Component
 * Allows users to create and edit SMS notification templates
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import './SmsTemplateEditor.css';
const COMMON_VARIABLES = [
    '{{name}}',
    '{{code}}',
    '{{link}}',
    '{{date}}',
    '{{time}}',
    '{{organizationName}}',
    '{{status}}',
    '{{priority}}',
];
const MAX_SMS_LENGTH = 160;
const MAX_SMS_LONG = 1600; // For concatenated SMS
export const SmsTemplateEditor = ({ userId, onSave, templateId, }) => {
    const [template, setTemplate] = useState({
        name: '',
        content: '',
        variables: [],
        maxLength: MAX_SMS_LENGTH,
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
            const response = await axios.get(`/api/multichannel/sms/templates`, {
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
            const response = await axios.get(`/api/multichannel/sms/templates/${id}`, {
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
        if (!template.name || !template.content) {
            setMessage('❌ Completa todos los campos requeridos');
            return;
        }
        if (template.content.length > MAX_SMS_LONG) {
            setMessage(`❌ El SMS es demasiado largo (máximo ${MAX_SMS_LONG} caracteres)`);
            return;
        }
        try {
            setSaving(true);
            const url = template.id
                ? `/api/multichannel/sms/templates/${template.id}`
                : `/api/multichannel/sms/templates`;
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
            await axios.delete(`/api/multichannel/sms/templates/${id}`, {
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
        const textarea = document.getElementById('sms-content');
        if (textarea) {
            const cursorPos = textarea.selectionStart;
            const newContent = template.content.substring(0, cursorPos) +
                variable +
                template.content.substring(cursorPos);
            handleContentChange(newContent);
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
    const handleContentChange = (value) => {
        const updatedTemplate = { ...template, content: value };
        updatedTemplate.variables = extractVariables(value);
        setTemplate(updatedTemplate);
    };
    const getSmsSegments = () => {
        return Math.ceil(template.content.length / MAX_SMS_LENGTH);
    };
    const getCharacterWarning = () => {
        const length = template.content.length;
        if (length === 0)
            return null;
        if (length <= MAX_SMS_LENGTH) {
            return { text: `${length}/${MAX_SMS_LENGTH}`, type: 'ok' };
        }
        if (length <= MAX_SMS_LONG) {
            return { text: `${length}/${MAX_SMS_LONG} (${getSmsSegments()} SMS)`, type: 'warning' };
        }
        return { text: `${length}/${MAX_SMS_LONG} (EXCEDIDO)`, type: 'error' };
    };
    if (loading && mode === 'list') {
        return _jsx("div", { className: "template-loading", children: "Cargando plantillas..." });
    }
    const charWarning = getCharacterWarning();
    return (_jsxs("div", { className: "sms-template-editor", children: [mode !== 'list' && (_jsxs("div", { className: "editor-header", children: [_jsx("button", { className: "back-button", onClick: () => {
                            setMode('list');
                            setTemplate({ name: '', content: '', variables: [], maxLength: MAX_SMS_LENGTH });
                        }, children: "\u2190 Volver a Plantillas" }), _jsx("h2", { children: mode === 'new' ? '💬 Nueva Plantilla SMS' : '💬 Editar Plantilla SMS' })] })), mode === 'list' && (_jsxs("div", { className: "templates-list", children: [_jsxs("div", { className: "list-header", children: [_jsx("h2", { children: "\uD83D\uDCAC Plantillas de SMS" }), _jsx("button", { className: "btn btn-primary", onClick: () => {
                                    setTemplate({
                                        name: '',
                                        content: '',
                                        variables: [],
                                        maxLength: MAX_SMS_LENGTH,
                                    });
                                    setMode('new');
                                }, children: "+ Nueva Plantilla" })] }), templates.length === 0 ? (_jsxs("div", { className: "no-templates", children: [_jsx("p", { children: "No hay plantillas disponibles" }), _jsx("p", { children: "Crea tu primera plantilla para comenzar" })] })) : (_jsx("div", { className: "templates-grid", children: templates.map((tpl) => (_jsxs("div", { className: "template-card", children: [_jsx("h3", { children: tpl.name }), _jsxs("p", { className: "template-preview", children: [tpl.content.substring(0, 60), "..."] }), _jsxs("p", { className: "template-length", children: [tpl.content.length, " caracteres", tpl.content.length > MAX_SMS_LENGTH &&
                                            ` (${Math.ceil(tpl.content.length / MAX_SMS_LENGTH)} SMS)`] }), tpl.variables && tpl.variables.length > 0 && (_jsxs("div", { className: "template-variables", children: [tpl.variables.slice(0, 3).map((v, i) => (_jsx("span", { className: "variable-tag", children: v }, i))), tpl.variables.length > 3 && (_jsxs("span", { className: "variable-tag", children: ["+", tpl.variables.length - 3] }))] })), _jsxs("div", { className: "template-actions", children: [_jsx("button", { className: "btn btn-small btn-primary", onClick: () => {
                                                setTemplate(tpl);
                                                setMode('edit');
                                            }, children: "Editar" }), _jsx("button", { className: "btn btn-small btn-danger", onClick: () => tpl.id && handleDelete(tpl.id), children: "Eliminar" })] })] }, tpl.id))) }))] })), (mode === 'new' || mode === 'edit') && (_jsxs("div", { className: "template-editor", children: [_jsxs("div", { className: "editor-form", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Nombre de la Plantilla *" }), _jsx("input", { type: "text", value: template.name, onChange: (e) => setTemplate({ ...template, name: e.target.value }), placeholder: "ej: C\u00F3digo OTP, Confirmaci\u00F3n, Alerta", className: "form-input" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Contenido del SMS *" }), _jsxs("div", { className: "variables-toolbar", children: [_jsx("span", { className: "toolbar-label", children: "Variables:" }), COMMON_VARIABLES.map((variable) => (_jsx("button", { type: "button", className: "variable-button", onClick: () => insertVariable(variable), children: variable }, variable)))] }), _jsx("textarea", { id: "sms-content", value: template.content, onChange: (e) => handleContentChange(e.target.value), placeholder: "Escribe el contenido del SMS... Usa {{variable}} para insertar variables din\u00E1micas", className: "form-textarea", rows: 6 }), charWarning && (_jsx("div", { className: `character-counter counter-${charWarning.type}`, children: _jsx("span", { children: charWarning.text }) }))] }), template.variables && template.variables.length > 0 && (_jsxs("div", { className: "detected-variables", children: [_jsx("h4", { children: "Variables Detectadas:" }), _jsx("div", { className: "variables-list", children: template.variables.map((v, i) => (_jsx("span", { className: "variable-tag", children: v }, i))) })] })), _jsxs("div", { className: "editor-actions", children: [_jsx("button", { className: "btn btn-primary", onClick: handleSave, disabled: saving || template.content.length > MAX_SMS_LONG, children: saving ? 'Guardando...' : '💾 Guardar Plantilla' }), _jsx("button", { type: "button", className: "btn btn-secondary", onClick: () => setShowPreview(!showPreview), children: showPreview ? '👁️ Ocultar Vista Previa' : '👁️ Vista Previa' }), template.id && (_jsx("button", { type: "button", className: "btn btn-danger", onClick: () => template.id && handleDelete(template.id), children: "\uD83D\uDDD1\uFE0F Eliminar" }))] })] }), showPreview && (_jsxs("div", { className: "editor-preview", children: [_jsxs("div", { className: "preview-header", children: [_jsx("h3", { children: "Vista Previa del SMS" }), charWarning && (_jsx("span", { className: `preview-length counter-${charWarning.type}`, children: charWarning.text }))] }), _jsxs("div", { className: "preview-content", children: [template.content.split('\n').map((line, i) => (_jsx("div", { className: "preview-line", children: line }, i))), !template.content && _jsx("div", { className: "preview-placeholder", children: "(sin contenido)" })] }), _jsx("div", { className: "preview-footer", children: _jsx("p", { className: "info-text", children: template.content.length === 0
                                        ? 'Escribe el contenido para ver vista previa'
                                        : template.content.length <= MAX_SMS_LENGTH
                                            ? '✅ Se enviará como 1 SMS'
                                            : `⚠️ Se dividirá en ${getSmsSegments()} SMS` }) })] }))] })), message && _jsx("div", { className: "editor-message", children: message })] }));
};
//# sourceMappingURL=SmsTemplateEditor.js.map