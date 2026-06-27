
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Books
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  content_url TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  year INT,
  categories TEXT[] DEFAULT '{}',
  source TEXT DEFAULT 'gutenberg',
  external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX books_title_idx ON public.books USING gin (to_tsvector('english', title || ' ' || author));
CREATE INDEX books_categories_idx ON public.books USING gin (categories);
GRANT SELECT ON public.books TO anon, authenticated;
GRANT ALL ON public.books TO service_role;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "books readable by all" ON public.books FOR SELECT USING (true);

-- Favorites
CREATE TABLE public.favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, book_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Bookmarks
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  page INT NOT NULL DEFAULT 1,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bookmarks_user_book_idx ON public.bookmarks (user_id, book_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Reading progress
CREATE TABLE public.reading_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  last_page INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, book_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_progress TO authenticated;
GRANT ALL ON public.reading_progress TO service_role;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own progress" ON public.reading_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed Project Gutenberg books
INSERT INTO public.books (title, author, description, cover_url, content_url, year, categories, external_id) VALUES
('Pride and Prejudice', 'Jane Austen', 'A sharp-witted romance about the Bennet sisters navigating love, class, and prejudice in Regency England.', 'https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg', 'https://www.gutenberg.org/cache/epub/1342/pg1342-images.html', 1813, ARRAY['Romance','Classic'], '1342'),
('Alice''s Adventures in Wonderland', 'Lewis Carroll', 'A young girl tumbles down a rabbit hole into a surreal world of talking creatures and absurd logic.', 'https://www.gutenberg.org/cache/epub/11/pg11.cover.medium.jpg', 'https://www.gutenberg.org/cache/epub/11/pg11-images.html', 1865, ARRAY['Fantasy','Children'], '11'),
('Frankenstein', 'Mary Shelley', 'A young scientist creates a sapient creature in an unorthodox experiment, with tragic consequences.', 'https://www.gutenberg.org/cache/epub/84/pg84.cover.medium.jpg', 'https://www.gutenberg.org/cache/epub/84/pg84-images.html', 1818, ARRAY['Horror','Gothic','Classic'], '84'),
('The Adventures of Sherlock Holmes', 'Arthur Conan Doyle', 'Twelve short stories chronicling the cases of the world''s most celebrated consulting detective.', 'https://www.gutenberg.org/cache/epub/1661/pg1661.cover.medium.jpg', 'https://www.gutenberg.org/cache/epub/1661/pg1661-images.html', 1892, ARRAY['Mystery','Classic'], '1661'),
('Moby Dick; or, The Whale', 'Herman Melville', 'Captain Ahab''s monomaniacal pursuit of the white whale, told by the sailor Ishmael.', 'https://www.gutenberg.org/cache/epub/2701/pg2701.cover.medium.jpg', 'https://www.gutenberg.org/cache/epub/2701/pg2701-images.html', 1851, ARRAY['Adventure','Classic'], '2701'),
('The Picture of Dorian Gray', 'Oscar Wilde', 'A beautiful young man trades his soul for eternal youth while his portrait bears every sin.', 'https://www.gutenberg.org/cache/epub/174/pg174.cover.medium.jpg', 'https://www.gutenberg.org/cache/epub/174/pg174-images.html', 1890, ARRAY['Gothic','Classic'], '174'),
('Dracula', 'Bram Stoker', 'An epistolary horror chronicling Count Dracula''s move from Transylvania to England.', 'https://www.gutenberg.org/cache/epub/345/pg345.cover.medium.jpg', 'https://www.gutenberg.org/cache/epub/345/pg345-images.html', 1897, ARRAY['Horror','Gothic'], '345'),
('A Tale of Two Cities', 'Charles Dickens', 'A sweeping story of love and sacrifice set against the French Revolution.', 'https://www.gutenberg.org/cache/epub/98/pg98.cover.medium.jpg', 'https://www.gutenberg.org/cache/epub/98/pg98-images.html', 1859, ARRAY['Historical','Classic'], '98'),
('Heart of Darkness', 'Joseph Conrad', 'A river journey into the Belgian Congo becomes a descent into the dark heart of imperialism.', 'https://www.gutenberg.org/cache/epub/219/pg219.cover.medium.jpg', 'https://www.gutenberg.org/cache/epub/219/pg219-images.html', 1899, ARRAY['Adventure','Classic'], '219'),
('The Strange Case of Dr. Jekyll and Mr. Hyde', 'Robert Louis Stevenson', 'A respectable London doctor and his sinister alter ego in one of literature''s most famous duets.', 'https://www.gutenberg.org/cache/epub/43/pg43.cover.medium.jpg', 'https://www.gutenberg.org/cache/epub/43/pg43-images.html', 1886, ARRAY['Horror','Gothic'], '43'),
('The War of the Worlds', 'H. G. Wells', 'Martians invade Victorian England in one of the earliest works of modern science fiction.', 'https://www.gutenberg.org/cache/epub/36/pg36.cover.medium.jpg', 'https://www.gutenberg.org/cache/epub/36/pg36-images.html', 1898, ARRAY['Sci-Fi','Classic'], '36'),
('The Adventures of Huckleberry Finn', 'Mark Twain', 'A boy and a runaway man raft down the Mississippi in Twain''s great American novel.', 'https://www.gutenberg.org/cache/epub/76/pg76.cover.medium.jpg', 'https://www.gutenberg.org/cache/epub/76/pg76-images.html', 1884, ARRAY['Adventure','Classic'], '76');
