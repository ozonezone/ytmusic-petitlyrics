import clsx from "clsx";
import { useRef, useState } from "react";
import { DefaultButton } from "../components/button";

export const TextForm = (
  props: { value: string; label: string; setter: (v: string) => any },
) => {
  return (
    <>
      <p className="yp:col-span-2">{props.label}</p>
      <input
        type="text"
        className="yp:col-span-3"
        value={props.value}
        onInput={(e) => {
          props.setter(e.currentTarget.value);
        }}
      />
    </>
  );
};
export const NumberForm = (
  props: { value: number; label: string; setter: (v: number) => any },
) => {
  const [invalid, setInvalid] = useState(false);
  return (
    <>
      <p className="yp:col-span-2">{props.label}</p>
      <input
        type="text"
        defaultValue={props.value}
        className={clsx("yp:focus:outline yp:border-b yp:col-span-3", {
          "yp:outline yp:outline-red-500": invalid,
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
    </>
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
    <>
      <p className="yp:col-span-2">{props.label}</p>
      <input
        type="text"
        defaultValue={props.value ?? ""}
        className={clsx("yp:focus:outline yp:border-b yp:col-span-2", {
          "yp:outline yp:outline-red-500": invalid,
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
      <DefaultButton
        className="yp:h-8 yp:col-span-1 yp:w-full yp:h-full"
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
      </DefaultButton>
    </>
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
    <>
      <p className="yp:col-span-2">{props.label}</p>
      <RadioGroup
        value={props.value}
        onChange={(v) => props.setter(v)}
        options={props.options}
      />
    </>
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
    <div className="yp:col-span-3 yp:flex yp:gap-2">
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
