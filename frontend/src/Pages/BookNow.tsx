import BookNowHero from "../Components/BookNow/BookNowHero";
import BookNowContact from "../Components/BookNow/BookNowContact";
import Seo from "../seo/Seo";

const BookNow = () => {
  return (
    <>
      <Seo
        title="Book a Consultation — Xaeon Software Solutions"
        description="Tell Xaeon what you need, or book a Google Meet and pick an open time."
        pathname="/book-now"
      />

      <BookNowHero />
      <BookNowContact />
    </>
  );
};

export default BookNow;
