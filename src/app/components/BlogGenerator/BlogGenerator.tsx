import styles from "./BlogGenerator.module.css";
import { BlogForm } from "@/app/components/BlogForm/BlogForm";

export function BlogGenerator() {
  return (
    <section className={styles.blogGenerator}>
      <BlogForm />
    </section>
  );
}
