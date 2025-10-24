import clsx from "clsx";

export const DefaultButton = (props: {
  children: React.ReactNode;
  className?: string;
  onClick: () => void;
}) => {
  return (
    <button
      className={clsx(
        "yp:bg-white/30 yp:border-none yp:text-white yp:w-10 yp:hover:bg-gray-500/50 yp:flex yp:justify-center",
        props.className,
      )}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
};
