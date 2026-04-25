import BookNowHero from "../Components/BookNow/BookNowHero";
import BookNowContact from "../Components/BookNow/BookNowContact";
import Seo from "../seo/Seo";

const BookNow = () => {
  return (
    <>
      <Seo
        title="Book a Consultation — Xaeon Software Solutions"
        description="Book a consultation with Xaeon. Tell us what you're building—we’ll help you move from idea to launch."
        pathname="/book-now"
      />

      <BookNowHero />
      <BookNowContact />
    </>
  );
};

export default BookNow;
