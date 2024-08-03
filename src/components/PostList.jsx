import {useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {fetchPosts, fetchTags, addPost} from "../api/api";

function PostList() {
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();

  const {
    data: postData,
    isError,
    error,
    isLoading,
    isPlaceholderData,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ["posts", {page}],
    queryFn: () => fetchPosts(page),
    staleTime: 1000 * 60 * 5, // 5 minutes
    // gcTime: 1000 * 60 * 60, // 1 hour
  });

  const {data: tagsData, isLoading: isTagsLoading} = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
    staleTime: Infinity,
  });

  const {
    mutate,
    isPending,
    isError: isPostError,
    reset,
    data,
  } = useMutation({
    mutationFn: addPost,
    retry: 3,
    onMutate: async () => {
      await queryClient.cancelQueries({queryKey: ["posts"], exact: true});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["posts", {page}],
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get("title");
    const tags = Array.from(formData.keys()).filter(
      (key) => formData.get(key) === "on"
    );

    if (!title || !tags) return;

    mutate({id: postData?.items + 1, title, tags});

    e.target.reset(); 
  };

  return (
    <div >
      <form onSubmit={handleSubmit}>
        {isPostError && <h5 onClick={() => reset()}>Unable to Post</h5>}
        <input
          type="text"
          placeholder="Enter your post.."
          className="postbox"
          name="title"
        />
        <div>
          {tagsData?.map((tag) => {
            return (
              <div key={tag}>
                <input name={tag} id={tag} type="checkbox" />
                <label htmlFor={tag}>{tag}</label>
              </div>
            );
          })}
        </div>
        <button disabled={isPending}>
          {isPending ? "Posting..." : "Post"}
        </button>
      </form>
      {(isLoading || isRefetching) && isTagsLoading && <p>Loading...</p>}
      {isError && <p>{error?.message}</p>}
      {error && <button onClick={refetch}>Refetch</button>}
      {postData?.data?.map((post) => {
        return (
          <div key={post.id} className="post">
            <div>{post.title}</div>
            {post.tags.map((tag) => {
              return <span key={tag}>{tag}</span>;
            })}
          </div>
        );
      })}

      {/* Pagination */}
      <div >
        <button
          onClick={() => setPage((old) => Math.max(old - 1, 0))}
          disabled={!postData?.prev}
        >
          Previous Page
        </button>
        <span>{page}</span>
        <button
          onClick={() => {
            if (!isPlaceholderData && postData?.next) {
              setPage((old) => old + 1);
            }
          }}
          disabled={isPlaceholderData || !postData?.next}
        >
          Next Page
        </button>
      </div>
    </div>
  );
}

export default PostList;