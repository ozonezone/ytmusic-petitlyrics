export const TextForm = (
  props: { value: string; label: string; setter: (v: string) => any },
) => {
  return (
    <div style={{ display: "flex", gap: "5px" }}>
      {props.label}:{" "}
      <input
        type="text"
        value={props.value}
        onInput={(e) => {
          props.setter(e.currentTarget.value);
        }}
      />
    </div>
  );
};
export const NumberForm = (
  props: { value: number; label: string; setter: (v: number) => any },
) => {
  return (
    <div style={{ display: "flex", gap: "5px" }}>
      {props.label}:{" "}
      <input
        type="number"
        value={props.value}
        onInput={(e) => {
          if (isNaN(e.currentTarget.valueAsNumber)) return;
          props.setter(e.currentTarget.valueAsNumber);
        }}
      />
    </div>
  );
};
export const RadioForm = (
  props: {
    value: string;
    label: string;
    setter: (v: string) => any;
    options: string[];
  },
) => {
  return (
    <div style={{ display: "flex", gap: "5px" }}>
      {props.label}:{" "}
      <RadioGroup
        value={props.value}
        onChange={(v) => props.setter(v)}
        options={props.options}
      />
    </div>
  );
};

export const RadioGroup = (
  props: {
    onChange: (value: string) => void;
    value: string;
    options: string[];
  },
) => {
  return (
    <div>
      {props.options.map((option, i) => (
        <label key={i}>
          <input
            type="radio"
            value={option}
            checked={props.value === option}
            onChange={() => props.onChange(option)}
          />
          {option}
        </label>
      ))}
    </div>
  );
};
