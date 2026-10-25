import Blogs from "../Components/Blogs/Blogs";
import Seo from "../seo/Seo";

const Blog = () => {
  return (
    <>
      <Seo
        title="Blog — Xaeon Software Solutions"
        description="Updates on software engineering, AI, product delivery, and digital growth from the Xaeon team."
        pathname="/blog"
      />
      <Blogs limit={Infinity} asPage />
    </>
  );
};

export default Blog;
