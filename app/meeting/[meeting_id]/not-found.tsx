export default function NotFound() {
  return (
    <div className="py-10">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">404 - Meeting Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The meeting you're looking for doesn't exist.
        </p>
        <p className="text-muted-foreground mb-6">
          Please check the URL or contact the meeting organizer.
        </p>
      </div>
    </div>
  );
}
