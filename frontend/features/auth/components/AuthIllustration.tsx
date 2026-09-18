
import Image from "next/image";

export function AuthIllustration() {
  return (
    <div className="relative h-full w-full min-h-full overflow-hidden bg-slate-100 border-l border-slate-200/60">
      <Image
        src="/pages/login_page.jpg"
        alt="A trusted workspace for your organization"
        fill
        priority
        unoptimized
        sizes="(max-width: 1024px) 50vw, 50vw"
        className="object-cover object-center w-full h-full"
      />
    </div>
  );
}
