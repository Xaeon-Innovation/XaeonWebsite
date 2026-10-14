import BookNowHero from "../Components/BookNow/BookNowHero";
import BookNowContact from "../Components/BookNow/BookNowContact";
import Seo from "../seo/Seo";

const BookNow = () => {
  return (
    <>
      <Seo
        title="Book a Consultation — Xaeon Software Solutions"
        description="Book a Google Meet with Xaeon. Pick an open time and we’ll email you the meeting link."
        pathname="/book-now"
      />

      <BookNowHero />
      <BookNowContact />
    </>
  );
};

export default BookNow;
