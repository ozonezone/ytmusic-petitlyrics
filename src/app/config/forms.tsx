import clsx from "clsx";
import { useRef, useState } from "react";

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
  const [invalid, setInvalid] = useState(false);
  return (
    <div className="yp-flex yp-gap-2">
      {props.label}:{" "}
      <input
        type="text"
        defaultValue={props.value}
        className={clsx("focus:yp-outline", {
          "yp-outline yp-outline-red-500": invalid,
        })}
        onInput={(e) => {
          const v = Number(e.currentTarget.value);
          if (isNaN(v)) {
            setInvalid(true);
            return;
          } else {
            setInvalid(false);
            props.setter(v);
          }
        }}
      />
    </div>
  );
};

export const NumberFormWithButton = (
  props: {
    value: number | null;
    label: string;
    setter: (v: number | null) => any;
  },
) => {
  const [invalid, setInvalid] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="yp-flex yp-gap-2">
      {props.label}:{" "}
      <input
        type="text"
        defaultValue={props.value ?? ""}
        className={clsx("focus:yp-outline", {
          "yp-outline yp-outline-red-500": invalid,
        })}
        ref={ref}
        onInput={(e) => {
          const v = Number(e.currentTarget.value);
          if (isNaN(v)) {
            setInvalid(true);
            return;
          }
        }}
      />
      <button
        onClick={() => {
          if (ref.current) {
            if (ref.current.value === "") {
              props.setter(null);
              return;
            }
            const v = Number(ref.current.value);
            if (!isNaN(v)) {
              props.setter(v);
            }
          }
        }}
      >
        Apply
      </button>
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
