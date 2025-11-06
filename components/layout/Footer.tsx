export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-6 md:h-16 md:flex-row md:py-0 px-4">
        <p className="text-center text-sm text-muted-foreground md:text-left">
          &copy; {currentYear} Studio Management. All rights reserved.
        </p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <a
            href="#"
            className="hover:text-foreground transition-colors"
          >
            Privacy
          </a>
          <a
            href="#"
            className="hover:text-foreground transition-colors"
          >
            Terms
          </a>
          <a
            href="#"
            className="hover:text-foreground transition-colors"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
