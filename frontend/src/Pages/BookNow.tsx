import { Helmet } from "react-helmet-async";
import BookNowHero from "../Components/BookNow/BookNowHero";
import BookNowContact from "../Components/BookNow/BookNowContact";

const BookNow = () => {
  return (
    <>
      <Helmet>
        <title>Book Now — Contact us — Xaeon Software Solutions</title>
        <meta
          name="description"
          content="Contact Xaeon to book a consultation. Tell us what you're building and we'll help you move from idea to launch."
        />
      </Helmet>

      <BookNowHero />
      <BookNowContact />
    </>
  );
};

export default BookNow;
