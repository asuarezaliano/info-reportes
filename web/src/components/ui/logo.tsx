import Image from "next/image";

type LogoProps = {
  size?: number;
  className?: string;
};

export default function Logo({ size = 100, className }: LogoProps) {
  return (
    <Image
      src="/Logo.jpg"
      alt="Nexo Aduanero"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
      priority
    />
  );
}
