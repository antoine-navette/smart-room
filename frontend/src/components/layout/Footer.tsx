export default function Footer() {
  return (
    <footer className="bg-surface-container dark:bg-surface-container-highest full-width border-t-[3px] border-on-surface dark:border-white flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop py-gutter gap-4 mt-auto">
      <div className="font-headline-md text-headline-md font-black text-on-surface dark:text-on-primary-fixed-dim">
        <img alt="SmartRoom Logo" className="h-6 object-contain grayscale" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0FdTkItJ87ihimpKDhkcKbOC1wUvPjz1jqt4H_ST0P2daWJMio5C4qVNuTpqaq3mYRayKnDd37n1amEUOMUXUJlcCeiHI7xg5rHsV9KCeMRVv1mBrlQJtLrh09b4mhRmnC1h0ygebqTscnYQVvRA0XTOvwre_M-3CvqY69smzZaeBx5OuOGs08uF76wt_GDAgwfjbo0tvVW7_w4XqqNjIP3OM8fhncDYTTH27mdcfOeHCeb1Z_12mjy2aAab8DccumpGE24y_IGqb"/>
      </div>
      <div className="flex flex-wrap justify-center gap-6">
        <a className="text-on-surface-variant dark:text-surface-variant hover:text-primary font-body-md text-body-md font-medium hover:underline transition-all hover:scale-105" href="#">Support</a>
        <a className="text-on-surface-variant dark:text-surface-variant hover:text-primary font-body-md text-body-md font-medium hover:underline transition-all hover:scale-105" href="#">Privacy Policy</a>
        <a className="text-on-surface-variant dark:text-surface-variant hover:text-primary font-body-md text-body-md font-medium hover:underline transition-all hover:scale-105" href="#">Terms of Service</a>
        <a className="text-on-surface-variant dark:text-surface-variant hover:text-primary font-body-md text-body-md font-medium hover:underline transition-all hover:scale-105" href="#">Help Desk</a>
      </div>
      <div className="text-on-surface-variant font-body-md text-body-md font-medium text-sm text-center md:text-left">
          © 2026 SmartRoom. Efficiency through Bold Structuralism.
      </div>
    </footer>
  )
}
