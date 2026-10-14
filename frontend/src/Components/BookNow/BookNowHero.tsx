import { useSearchParams } from "react-router";

import styles from "./BookNowHero.module.css";

const BookNowHero = () => {
  const [searchParams] = useSearchParams();
  const showMeeting = searchParams.get("meeting") === "1";

  return (
    <section className={styles.hero}>
      <div className={styles.heroBg} aria-hidden />
      <div className={styles.overlay} aria-hidden />

      <div className={styles.container}>
        <h1 className={styles.title}>{showMeeting ? "Book a meeting" : "Contact Us"}</h1>
        <p className={styles.subtitle}>
          {showMeeting ? "Choose a time for a Google Meet" : "And Let's Build Something Timeless"}
        </p>
      </div>
    </section>
  );
};

export default BookNowHero;
