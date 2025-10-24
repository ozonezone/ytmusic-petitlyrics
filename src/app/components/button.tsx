import clsx from "clsx";

export const DefaultButton = (props: {
  children: React.ReactNode;
  className?: string;
  onClick: () => void;
}) => {
  return (
    <button
      className={clsx(
        "yp:bg-white/10 yp:border-none yp:text-white yp:w-14 yp:h-8 yp:hover:bg-gray-500/50 yp:flex yp:justify-center",
        props.className,
      )}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
};
