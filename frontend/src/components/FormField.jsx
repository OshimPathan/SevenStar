import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Reusable form field component with:
 * - Required indicator (red asterisk)
 * - Helper text below field
 * - Error state with message
 * - Optional leading icon
 * - Character count for textareas
 * - Responsive sizing (min 44px touch target)
 */
const FormField = ({
    label,
    name,
    type = 'text',
    value,
    onChange,
    required = false,
    placeholder = '',
    helper = '',
    error = '',
    icon: Icon = null,
    options = [],       // for select: [{ value, label }] or ['string']
    rows = 4,           // for textarea
    maxLength,          // for textarea character count
    min,
    max,
    step,
    accept,             // for file input
    disabled = false,
    className = '',     // wrapper className override
    inputClassName = '', // input className override
    children,           // for custom content inside the field wrapper
}) => {
    const baseInput = `w-full px-3 py-2.5 border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50 disabled:text-gray-400 min-h-[44px] ${error
            ? 'border-red-300 focus:ring-red-200 focus:border-red-400 bg-red-50/30'
            : 'border-gray-200 hover:border-gray-300 bg-white'
        } ${Icon ? 'pl-10' : ''} ${inputClassName}`;

    const renderInput = () => {
        switch (type) {
            case 'select':
                return (
                    <select
                        name={name}
                        value={value}
                        onChange={onChange}
                        required={required}
                        disabled={disabled}
                        className={`${baseInput} bg-white appearance-none cursor-pointer`}
                    >
                        {options.map((opt, i) => {
                            if (typeof opt === 'string') return <option key={i} value={opt}>{opt}</option>;
                            return <option key={opt.value ?? i} value={opt.value}>{opt.label}</option>;
                        })}
                    </select>
                );

            case 'textarea':
                return (
                    <div className="relative">
                        <textarea
                            name={name}
                            value={value}
                            onChange={onChange}
                            required={required}
                            disabled={disabled}
                            placeholder={placeholder}
                            rows={rows}
                            maxLength={maxLength}
                            className={`${baseInput} resize-none`}
                        />
                        {maxLength && (
                            <span className={`absolute bottom-2 right-3 text-[10px] font-medium ${(value?.length || 0) > maxLength * 0.9 ? 'text-red-400' : 'text-gray-300'
                                }`}>
                                {value?.length || 0}/{maxLength}
                            </span>
                        )}
                    </div>
                );

            case 'file':
                return (
                    <input
                        type="file"
                        name={name}
                        onChange={onChange}
                        required={required}
                        disabled={disabled}
                        accept={accept}
                        className={`${baseInput} file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer cursor-pointer`}
                    />
                );

            default:
                return (
                    <input
                        type={type}
                        name={name}
                        value={value}
                        onChange={onChange}
                        required={required}
                        disabled={disabled}
                        placeholder={placeholder}
                        min={min}
                        max={max}
                        step={step}
                        className={baseInput}
                    />
                );
        }
    };

    return (
        <div className={`space-y-1 ${className}`}>
            {label && (
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-400 text-xs">*</span>}
                </label>
            )}
            <div className="relative">
                {Icon && type !== 'select' && type !== 'textarea' && type !== 'file' && (
                    <Icon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}
                {children || renderInput()}
            </div>
            {error && (
                <p className="flex items-center gap-1 text-xs text-red-500 font-medium animate-fade-in">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {error}
                </p>
            )}
            {helper && !error && (
                <p className="text-[11px] text-gray-400 leading-tight">{helper}</p>
            )}
        </div>
    );
};

export default FormField;
