type FormSelectOption = { value: string; label: string };

type FormSelectProps = {
  label: string;
  name: string;
  options: FormSelectOption[];
  required?: boolean;
  hint?: string;
  error?: string;
  defaultValue?: string;
  placeholder?: string;
};

/**
 * Select del nuevo sistema de diseño (misma estructura de label/asterisco/hint
 * que `FormInput`, mismo estilo de fondo gris claro y focus).
 *
 * El hint va a la derecha del label (NO se repite debajo); debajo solo va el
 * `error`. Renderiza una opción placeholder deshabilitada para forzar elección.
 */
export function FormSelect({
  label,
  name,
  options,
  required,
  hint,
  error,
  defaultValue,
  placeholder = "Seleccioná una opción",
}: FormSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="flex items-center gap-1 text-sm font-medium text-on-surface"
      >
        <span className="flex items-center gap-0.5">
          {label}
          {required && (
            <span aria-hidden="true" className="font-semibold text-error">
              *
            </span>
          )}
        </span>
        {hint && (
          <span className="ml-auto text-right text-xs font-normal text-on-surface-variant">
            {hint}
          </span>
        )}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        className="h-10 w-full rounded border-0 bg-surface-container-low px-3 text-sm text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opcion) => (
          <option key={opcion.value} value={opcion.value}>
            {opcion.label}
          </option>
        ))}
      </select>
      {error && (
        <span role="alert" className="text-xs font-medium text-error">
          {error}
        </span>
      )}
    </div>
  );
}
