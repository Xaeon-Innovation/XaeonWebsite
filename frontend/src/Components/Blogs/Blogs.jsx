import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';
import styles from './Blogs.module.css';

const BlogPostCard = ({ imageSrc, category, date, readTime, title, description, linkText }) => (
  <motion.article
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    viewport={{ once: true }}
    className={styles.blogCard}
  >
    <div className={styles.blogImage}>
      <div className={styles.imagePlaceholder}>
        <div className={styles.imageIcon}>📝</div>
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
      <a href="#" className={styles.blogLink}>{linkText}</a>
    </div>
  </motion.article>
);

const Blogs = () => {
  const blogPosts = [
    {
      imageSrc: "/placeholder-blog-1.jpg",
      category: "Technology",
      date: "Dec 15, 2024",
      readTime: "5 min read",
      title: "The Future of Web Development in 2024",
      description: "Exploring the latest trends and technologies shaping the web development landscape and what developers need to know.",
      linkText: "Read More"
    },
    {
      imageSrc: "/placeholder-blog-2.jpg",
      category: "Design",
      date: "Dec 10, 2024",
      readTime: "7 min read",
      title: "Mobile-First Design: Why It Matters",
      description: "Understanding the importance of mobile-first approach in modern web design and how it impacts user experience.",
      linkText: "Read More"
    },
    {
      imageSrc: "/placeholder-blog-3.jpg",
      category: "Innovation",
      date: "Dec 5, 2024",
      readTime: "6 min read",
      title: "AI Integration in Software Development",
      description: "How artificial intelligence is revolutionizing the software development process and what it means for the future.",
      linkText: "Read More"
    }
  ];

  return (
    <section className={styles.blogs}>
      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className={styles.header}
        >
          <h2 className={styles.title}>Blogs</h2>
        </motion.div>

        <div className={styles.blogsGrid}>
          {blogPosts.map((post, index) => (
            <BlogPostCard
              key={index}
              imageSrc={post.imageSrc}
              category={post.category}
              date={post.date}
              readTime={post.readTime}
              title={post.title}
              description={post.description}
              linkText={post.linkText}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Blogs;
