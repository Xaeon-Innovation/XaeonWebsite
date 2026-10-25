import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, FileText } from "lucide-react";
import api from "../../lib/api";
import styles from "./Blogs.module.css";

interface BlogPostCardProps {
  category: string;
  date: string;
  readTime: string;
  title: string;
  description: string;
}

type BlogPostFromApi = {
  _id: string;
  title: string;
  description?: string;
  createdAt?: string;
};

const BlogPostCard = ({
  category,
  date,
  readTime,
  title,
  description
}: BlogPostCardProps) => (
  <motion.article
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    viewport={{ once: true }}
    className={styles.blogCard}
  >
    <div className={styles.blogImage}>
      <div className={styles.imagePlaceholder}>
        <FileText className={styles.imageIcon} aria-hidden="true" />
      </div>
      <div className={styles.categoryBadge}>{category}</div>
    </div>
    <div className={styles.blogContent}>
      <div className={styles.blogMeta}>
        <div className={styles.metaItem}>
          <Calendar size={14} />
          <span>{date}</span>
        </div>
        <div className={styles.metaItem}>
          <Clock size={14} />
          <span>{readTime}</span>
        </div>
      </div>
      <h3 className={styles.blogTitle}>{title}</h3>
      <p className={styles.blogDescription}>{description}</p>
    </div>
  </motion.article>
);

type BlogsProps = {
  /** How many of the newest posts to show (Home shows 3, the Blog page shows all). */
  limit?: number;
  /** Rendered as the main content of /blog: the heading becomes the page h1. */
  asPage?: boolean;
};

const Blogs = ({ limit = 3, asPage = false }: BlogsProps) => {
  const Heading = asPage ? "h1" : "h2";
  const [blogPosts, setBlogPosts] = useState<BlogPostFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cards: (BlogPostCardProps & { id: string })[] = useMemo(() => {
    const sorted = [...blogPosts].sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at;
    });

    return sorted.slice(0, limit).map((post) => {
      const createdAt = post.createdAt ? new Date(post.createdAt) : null;
      const date = createdAt ? createdAt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" }) : "";

      const words = (post.description ?? "").trim().split(/\s+/).filter(Boolean);
      const minutes = Math.max(1, Math.ceil(words.length / 180));

      return {
        id: post._id,
        category: "Insights",
        date,
        readTime: `${minutes} min read`,
        title: post.title,
        description: post.description ?? ""
      };
    });
  }, [blogPosts, limit]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/blog-post");
        const data = res.data as { blogPosts?: BlogPostFromApi[] };
        if (cancelled) return;
        setBlogPosts(data.blogPosts ?? []);
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setError("Couldn't load posts right now. Please try again later.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      className={asPage ? `${styles.blogs} ${styles.blogsPage}` : styles.blogs}
      aria-labelledby="blogs-heading"
    >
      <div className="section-title-rail">
        <motion.header
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="section-header-spacing"
        >
          <div className={styles.sectionLabel}>Blogs</div>
          <Heading id="blogs-heading" className={styles.sectionHeading}>
            Insights that{" "}
            <span className={styles.sectionHeadingAccent}>matter</span>
          </Heading>
        </motion.header>

        {loading ? (
          <div className={styles.blogsGrid} aria-live="polite">
            <div className={styles.blogCard}>Loading...</div>
          </div>
        ) : error ? (
          <div className={styles.blogsGrid} aria-live="polite">
            <div className={styles.blogCard}>{error}</div>
          </div>
        ) : cards.length === 0 ? (
          <div className={styles.blogsGrid} aria-live="polite">
            <div className={styles.blogCard}>New articles are on the way. Check back soon.</div>
          </div>
        ) : (
          <div className={styles.blogsGrid}>
            {cards.map((post) => (
              <BlogPostCard
                key={post.id}
                category={post.category}
                date={post.date}
                readTime={post.readTime}
                title={post.title}
                description={post.description}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Blogs;
