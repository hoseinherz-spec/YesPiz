"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Checkbox,
  CheckboxGroup,
  ComboBox,
  FieldError,
  Fieldset,
  Form as HeroForm,
  Input as HeroInput,
  Label,
  ListBox,
  Radio,
  RadioGroup,
  Select as HeroSelect,
  Switch,
  SearchField as HeroSearchField,
  TextArea as HeroTextArea,
  TextField,
} from "@heroui/react";
import {
  Children,
  Fragment,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ComponentProps,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import {
  FormProvider,
  useController,
  useForm,
  useFormContext,
  type Resolver,
} from "react-hook-form";
import { z } from "zod";
import { fieldSchema, type Rules } from "./form-schemas";

export { z, Fieldset };
type Values = Record<string, unknown>;
type Registry = Map<string, z.ZodType>;
const ValidationContext = createContext<Registry | null>(null);

/** A separate RHF instance for each submission boundary, including inline editors. */
export function FormScope({ children }: { children: ReactNode }) {
  const [registry] = useState<Registry>(() => new Map());
  const resolver: Resolver<Values> = (values, context, options) =>
    zodResolver(z.object(Object.fromEntries(registry)))(
      values,
      context,
      options,
    );
  const methods = useForm<Values>({
    resolver,
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldUnregister: true,
  });
  return (
    <ValidationContext.Provider value={registry}>
      <FormProvider {...methods}>{children}</FormProvider>
    </ValidationContext.Provider>
  );
}

export function Form(props: ComponentProps<typeof HeroForm>) {
  return (
    <FormScope>
      <FormBody {...props} />
    </FormScope>
  );
}
function FormBody({
  onSubmit,
  onReset,
  ...props
}: ComponentProps<typeof HeroForm>) {
  const form = useFormContext();
  return (
    <HeroForm
      {...props}
      validationBehavior="aria"
      onReset={(event) => {
        form.reset();
        onReset?.(event);
      }}
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit(() => onSubmit?.(event))(event);
      }}
    />
  );
}

/** Use for save/send actions in an inline editor without a native form element. */
export function FormAction({
  onPress,
  ...props
}: ComponentProps<typeof Button>) {
  const form = useFormContext();
  return (
    <Button
      {...props}
      type="button"
      onPress={(event) => {
        if (!form) throw new Error("FormAction requires FormScope");
        void form.handleSubmit(() => onPress?.(event))();
      }}
    />
  );
}

export function useFormAction(action: () => void) {
  const form = useFormContext();
  return () => {
    if (form) void form.handleSubmit(action)();
    else action();
  };
}

/** Cross-field validation for domain objects such as dynamic menu definitions. */
export function FormValue({
  name,
  value,
  schema,
}: {
  name: string;
  value: unknown;
  schema: z.ZodType;
}) {
  const flatSchema = z.unknown().superRefine((v, ctx) => {
    const result = schema.safeParse(v);
    if (!result.success)
      ctx.addIssue({
        code: "custom",
        message: result.error.issues
          .map(
            (issue) =>
              `${issue.path.length ? `${issue.path.join(".")}: ` : ""}${issue.message}`,
          )
          .join(" · "),
      });
  });
  const { fieldState } = useField(name, value, value, { schema: flatSchema });
  return fieldState.error ? (
    <p role="alert" className="text-sm text-danger">
      {fieldState.error.message || "Check the form values."}
    </p>
  ) : null;
}

function useField(
  name: string | undefined,
  value: unknown,
  defaultValue: unknown,
  rules: Rules,
) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const fieldName = name || `field_${id}`;
  const form = useFormContext<Values>();
  const registry = useContext(ValidationContext);
  const controlled = useController({
    name: fieldName,
    control: form.control,
    defaultValue:
      value !== undefined
        ? value
        : defaultValue !== undefined
          ? defaultValue
          : "",
  });
  const schema = fieldSchema(rules);
  useEffect(() => {
    registry?.set(fieldName, schema);
    return () => {
      registry?.delete(fieldName);
    };
  }, [registry, fieldName, schema]);
  const { setValue } = form;
  useEffect(() => {
    const current = form.getValues(fieldName);
    const equal =
      value === current ||
      (value !== null &&
        typeof value === "object" &&
        JSON.stringify(value) === JSON.stringify(current));
    // A controlled draft may normalize an edit back to its previous value.
    // Compare objects by content because RHF clones registered domain objects.
    if (value !== undefined && !equal)
      setValue(fieldName, value, {
        shouldValidate: !!form.getFieldState(fieldName).error,
      });
  }, [value, fieldName, form, setValue, controlled.field.value]);
  return { ...controlled, id: `input_${id}` };
}

function Boundary({ children }: { children: ReactNode }) {
  const parent = useContext(ValidationContext);
  return parent ? <>{children}</> : <FormScope>{children}</FormScope>;
}
type Decorated = {
  label?: ReactNode;
  labelClassName?: string;
  wrapperClassName?: string;
  schema?: z.ZodType;
};
type InputProps = InputHTMLAttributes<HTMLInputElement> & Decorated;
export function Input(props: InputProps) {
  return (
    <Boundary>
      <InputField {...props} />
    </Boundary>
  );
}
function InputField({
  label,
  labelClassName,
  wrapperClassName,
  schema,
  ...props
}: InputProps) {
  const boolean = props.type === "checkbox";
  const file = props.type === "file";
  const { field, fieldState, id } = useField(
    props.name,
    boolean
      ? props.checked
      : props.value === undefined
        ? undefined
        : String(props.value),
    boolean
      ? (props.defaultChecked ?? false)
      : file
        ? null
        : props.defaultValue,
    {
      ...props,
      schema:
        schema ??
        (file
          ? z
              .file()
              .max(10 * 1024 * 1024)
              .mime(["image/jpeg", "image/png"])
              .nullable()
          : undefined),
    },
  );
  const inputId = props.id ?? id;
  if (boolean)
    return (
      <Checkbox
        id={inputId}
        name={field.name}
        className={wrapperClassName}
        isSelected={props.checked ?? Boolean(field.value)}
        isDisabled={props.disabled}
        isRequired={props.required}
        isInvalid={!!fieldState.error}
        validationBehavior="aria"
        aria-label={props["aria-label"]}
        onBlur={field.onBlur}
        onChange={(checked) => {
          field.onChange(checked);
          props.onChange?.({
            target: { checked, value: String(props.value ?? "on") },
          } as React.ChangeEvent<HTMLInputElement>);
        }}
      >
        <Checkbox.Content ref={field.ref}>
          <Checkbox.Control className={props.className}>
            <Checkbox.Indicator />
          </Checkbox.Control>
          {label}
        </Checkbox.Content>
        <FieldError>{fieldState.error?.message}</FieldError>
      </Checkbox>
    );
  if (props.type === "radio")
    throw new Error("Use RadioField for a radio group.");
  return (
    <TextField
      className={wrapperClassName ?? "min-w-0"}
      name={field.name}
      isInvalid={!!fieldState.error}
      isRequired={props.required}
      isDisabled={props.disabled}
      validationBehavior="aria"
      aria-label={props["aria-label"]}
    >
      {label && (
        <Label className={labelClassName} htmlFor={inputId}>
          {label}
        </Label>
      )}
      <HeroInput
        {...props}
        aria-invalid={fieldState.invalid || props["aria-invalid"]}
        id={inputId}
        name={field.name}
        ref={field.ref}
        defaultValue={undefined}
        value={file ? undefined : String(props.value ?? field.value ?? "")}
        onBlur={(event) => {
          field.onBlur();
          props.onBlur?.(event);
        }}
        onChange={(event) => {
          const value = file
            ? (event.target.files?.[0] ?? null)
            : event.target.value;
          field.onChange(value);
          if (
            !file ||
            fieldSchema({
              ...props,
              schema:
                schema ??
                z
                  .file()
                  .max(10 * 1024 * 1024)
                  .mime(["image/jpeg", "image/png"])
                  .nullable(),
            }).safeParse(value).success
          )
            props.onChange?.(event);
          if (file) field.onBlur();
        }}
      />
      <FieldError>{fieldState.error?.message}</FieldError>
    </TextField>
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & Decorated;
export function TextArea(props: TextAreaProps) {
  return (
    <Boundary>
      <TextAreaField {...props} />
    </Boundary>
  );
}
function TextAreaField({
  label,
  wrapperClassName,
  schema,
  ...props
}: TextAreaProps) {
  const { field, fieldState, id } = useField(
    props.name,
    props.value,
    props.defaultValue,
    { ...props, schema },
  );
  return (
    <TextField
      className={wrapperClassName ?? "min-w-0"}
      name={field.name}
      isInvalid={!!fieldState.error}
      isRequired={props.required}
      isDisabled={props.disabled}
      validationBehavior="aria"
      aria-label={props["aria-label"]}
    >
      {label && <Label htmlFor={props.id ?? id}>{label}</Label>}
      <HeroTextArea
        {...props}
        id={props.id ?? id}
        ref={field.ref}
        name={field.name}
        defaultValue={undefined}
        value={String(props.value ?? field.value ?? "")}
        onBlur={(event) => {
          field.onBlur();
          props.onBlur?.(event);
        }}
        onChange={(event) => {
          field.onChange(event.target.value);
          props.onChange?.(event);
        }}
      />
      <FieldError>{fieldState.error?.message}</FieldError>
    </TextField>
  );
}

type Choice = { id: string; label: ReactNode; disabled?: boolean };
function choices(children: ReactNode): Choice[] {
  return Children.toArray(children).flatMap((child) => {
    if (
      !isValidElement<{
        children?: ReactNode;
        value?: string | number;
        disabled?: boolean;
      }>(child)
    )
      return [];
    if (child.type === Fragment) return choices(child.props.children);
    return [
      {
        id: String(child.props.value ?? textContent(child.props.children)),
        label: child.props.children,
        disabled: child.props.disabled,
      },
    ];
  });
}
type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> &
  Decorated & {
    onChange?: (event: { target: { value: string } }) => void;
    searchable?: boolean;
  };
export function Select(props: SelectProps) {
  return (
    <Boundary>
      <SelectField {...props} />
    </Boundary>
  );
}
function SelectField({
  label,
  wrapperClassName,
  schema,
  searchable,
  children,
  ...props
}: SelectProps) {
  const options = useMemo(() => choices(children), [children]);
  const { field, fieldState } = useField(
    props.name,
    props.value === undefined ? undefined : String(props.value),
    props.defaultValue ?? options[0]?.id ?? "",
    {
      required: props.required,
      disabled: props.disabled,
      schema:
        schema ??
        z
          .string()
          .refine(
            (v) =>
              (!props.required && !v) ||
              options.some((o) => o.id === v && !o.disabled),
            "Choose an available option.",
          ),
    },
  );
  const change = (value: string | number | null) => {
    const v = String(value ?? "");
    field.onChange(v);
    props.onChange?.({ target: { value: v } });
  };
  const items = useMemo(
    () =>
      options.map((option) => ({
        ...option,
        key: option.id || "__empty_option__",
      })),
    [options],
  );
  const list = (
    <ListBox>
      {items.map((option) => (
        <ListBox.Item
          key={option.key}
          id={option.key}
          textValue={textContent(option.label)}
          isDisabled={option.disabled}
        >
          {option.label}
          <ListBox.ItemIndicator />
        </ListBox.Item>
      ))}
    </ListBox>
  );
  const common = {
    name: field.name,
    className: wrapperClassName ?? "min-w-0",
    isDisabled: props.disabled,
    isRequired: props.required,
    isInvalid: !!fieldState.error,
    "aria-label": props["aria-label"],
    onBlur: field.onBlur,
  };
  if (searchable)
    return (
      <ComboBox
        {...common}
        menuTrigger="input"
        selectedKey={String((props.value ?? field.value) || "__empty_option__")}
        onSelectionChange={(v) => change(v === "__empty_option__" ? "" : v)}
        validationBehavior="aria"
      >
        {label && <Label>{label}</Label>}
        <ComboBox.InputGroup>
          <HeroInput ref={field.ref} className={props.className} />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>{list}</ComboBox.Popover>
        <FieldError>{fieldState.error?.message}</FieldError>
      </ComboBox>
    );
  return (
    <HeroSelect
      {...common}
      value={String((props.value ?? field.value) || "__empty_option__")}
      onChange={(v) => change(v === "__empty_option__" ? "" : (v as string))}
      validationBehavior="aria"
    >
      {label && <Label>{label}</Label>}
      <HeroSelect.Trigger ref={field.ref} className={props.className}>
        <HeroSelect.Value />
        <HeroSelect.Indicator />
      </HeroSelect.Trigger>
      <HeroSelect.Popover>{list}</HeroSelect.Popover>
      <FieldError>{fieldState.error?.message}</FieldError>
    </HeroSelect>
  );
}
function textContent(node: ReactNode): string {
  return Children.toArray(node)
    .map((c) =>
      isValidElement<{ children?: ReactNode }>(c)
        ? textContent(c.props.children)
        : String(c),
    )
    .join("");
}

type RadioProps = Decorated & {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: Choice[];
  required?: boolean;
  disabled?: boolean;
  className?: string;
};
export function RadioField(props: RadioProps) {
  return (
    <Boundary>
      <RadioFieldBody {...props} />
    </Boundary>
  );
}
function RadioFieldBody({ label, options, onChange, ...props }: RadioProps) {
  const { field, fieldState } = useField(props.name, props.value, "", {
    disabled: props.disabled,
    required: props.required,
    schema:
      props.schema ??
      z
        .string()
        .refine(
          (v) =>
            (!v && !props.required) ||
            options.some((o) => o.id === v && !o.disabled),
          "Choose an available option.",
        ),
  });
  return (
    <RadioGroup
      name={field.name}
      value={props.value}
      onChange={(v) => {
        field.onChange(v);
        onChange(v);
      }}
      onBlur={field.onBlur}
      isDisabled={props.disabled}
      isRequired={props.required}
      isInvalid={!!fieldState.error}
      validationBehavior="aria"
      className={props.className}
    >
      {label && <Label>{label}</Label>}
      {options.map((option, index) => (
        <Radio key={option.id} value={option.id} isDisabled={option.disabled}>
          <Radio.Content ref={index === 0 ? field.ref : undefined}>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            {option.label}
          </Radio.Content>
        </Radio>
      ))}
      <FieldError>{fieldState.error?.message}</FieldError>
    </RadioGroup>
  );
}

export function SwitchField(props: {
  name?: string;
  label: ReactNode;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Boundary>
      <SwitchFieldBody {...props} />
    </Boundary>
  );
}
function SwitchFieldBody(props: {
  name?: string;
  label: ReactNode;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const { field } = useField(props.name, props.value, false, {
    type: "checkbox",
  });
  return (
    <Switch
      name={field.name}
      isSelected={props.value}
      isDisabled={props.disabled}
      onBlur={field.onBlur}
      onChange={(v) => {
        field.onChange(v);
        props.onChange(v);
      }}
    >
      <Switch.Content ref={field.ref}>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        {props.label}
      </Switch.Content>
    </Switch>
  );
}

type CheckboxGroupProps = {
  name?: string;
  label: ReactNode;
  value: string[];
  onChange: (value: string[]) => void;
  options: Choice[];
  min?: number;
  max?: number;
};
export function CheckboxGroupField(props: CheckboxGroupProps) {
  return (
    <Boundary>
      <CheckboxGroupBody {...props} />
    </Boundary>
  );
}
function CheckboxGroupBody({
  min = 0,
  max = 30,
  ...props
}: CheckboxGroupProps) {
  const schema = z
    .array(z.string())
    .min(min, `Choose at least ${min}.`)
    .max(max, `Choose at most ${max}.`)
    .refine(
      (values) =>
        values.every((v) =>
          props.options.some((o) => o.id === v && !o.disabled),
        ),
      "An option is no longer available.",
    );
  const { field, fieldState } = useField(props.name, props.value, [], {
    schema,
  });
  return (
    <CheckboxGroup
      name={field.name}
      value={props.value}
      onChange={(v) => {
        field.onChange(v);
        props.onChange(v);
      }}
      onBlur={field.onBlur}
      isInvalid={!!fieldState.error}
      validationBehavior="aria"
    >
      <Label>{props.label}</Label>
      {props.options.map((o, i) => (
        <Checkbox
          key={o.id}
          value={o.id}
          isDisabled={
            o.disabled ||
            (props.value.length >= max && !props.value.includes(o.id))
          }
        >
          <Checkbox.Content ref={i === 0 ? field.ref : undefined}>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            {o.label}
          </Checkbox.Content>
        </Checkbox>
      ))}
      <FieldError>{fieldState.error?.message}</FieldError>
    </CheckboxGroup>
  );
}

function Search(props: ComponentProps<typeof HeroSearchField>) {
  return (
    <Boundary>
      <SearchBody {...props} />
    </Boundary>
  );
}
function SearchBody({
  children,
  value,
  defaultValue,
  onChange,
  ...props
}: ComponentProps<typeof HeroSearchField>) {
  const { field, fieldState } = useField(
    props.name,
    value,
    defaultValue ?? "",
    { maxLength: 200 },
  );
  return (
    <HeroSearchField
      {...props}
      name={field.name}
      value={String(field.value)}
      onChange={(v) => {
        field.onChange(v);
        onChange?.(v);
      }}
      onBlur={field.onBlur}
      isInvalid={!!fieldState.error}
      validationBehavior="aria"
    >
      {(state) => (
        <>
          {typeof children === "function" ? children(state) : children}
          <FieldError>{fieldState.error?.message}</FieldError>
        </>
      )}
    </HeroSearchField>
  );
}
export const SearchField = Object.assign(Search, {
  Group: HeroSearchField.Group,
  Input: HeroSearchField.Input,
  SearchIcon: HeroSearchField.SearchIcon,
  ClearButton: HeroSearchField.ClearButton,
});
