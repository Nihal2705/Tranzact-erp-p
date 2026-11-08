
export default function Logo({ size = 34 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path
        d="M5 7 Q5 5 7 5 H24 L17 13 H5 Z"
        fill="white"
      />
      <path
        d="M27 5 Q31 3 34 6 L17 32 Q14 36 10 33 L7 31 Z"
        fill="white"
      />
      <path
        d="M19 35 H36 Q38 35 39 32 L34 27 Z"
        fill="white"
      />
    </svg>
  );
}
