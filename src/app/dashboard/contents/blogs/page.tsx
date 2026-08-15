"use client";
import { DataTable } from "@/components/Dashboard/DataTable";
import BlogRichEditor from "@/components/Dashboard/BlogRichEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RoleGuard } from "@/middleware/roleGuard";
import { apiService } from "@/services/apiService";
import { ContentService } from "@/services/dashboardService";
import { BookOpen, Edit, Eye, ImagePlus, Loader2, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface BlogFormData {
  title: string;
  content: string;
  excerpt: string;
  image: string;
  images: string[];
  category: "service" | "news" | "update" | "promotion";
  tags: string;
  status: "draft" | "published";
}

interface BlogRow {
  _id: string;
  title: string;
  content?: string;
  excerpt?: string;
  image?: string;
  images?: string[];
  category?: string;
  tags?: string[];
  author?: { name?: string; email?: string } | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState<BlogRow | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BlogFormData>({
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      image: "",
      images: [],
      category: "service",
      tags: "",
      status: "draft",
    },
  });

  const contentValue = watch("content");
  const imageValue = watch("image");
  const imagesValue = watch("images") || [];

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await ContentService.getBlogs({ limit: 50 });
      if (response.success) {
                    {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                    {/* @ts-expect-error */}
        setBlogs(response.data || []);
      } else {
        toast.error(response.message || "Failed to fetch blogs");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    reset();
    setSelectedBlog(null);
    setDialogMode("create");
    setIsDialogOpen(true);
  };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEdit = (blog: any) => {
    setSelectedBlog(blog);
    setDialogMode("edit");
    setValue("title", blog.title || "");
    setValue("content", blog.content || "");
    setValue("excerpt", blog.excerpt || "");
    setValue("image", blog.image || "");
    setValue(
      "images",
      Array.isArray(blog.images)
        ? blog.images
        : blog.image
          ? [blog.image]
          : []
    );
    setValue("category", blog.category || "service");
    setValue(
      "tags",
      Array.isArray(blog.tags) ? blog.tags.join(", ") : blog.tags || ""
    );
    setValue("status", blog.status === "published" ? "published" : "draft");
    setIsDialogOpen(true);
  };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleView = (blog: any) => {
    setSelectedBlog(blog);
    setDialogMode("view");
    setIsDialogOpen(true);
  };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDelete = async (blog: any) => {
    if (!confirm(`Are you sure you want to delete "${blog.title}"?`)) {
      return;
    }

    try {
      const response = await ContentService.deleteBlog(blog._id);
      if (response.success) {
        toast.success("Blog deleted successfully");
        fetchBlogs();
      } else {
        toast.error(response.message || "Failed to delete blog");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const onSubmit = async (data: BlogFormData) => {
    try {
      const blogData = {
        ...data,
        tags: data.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        isPublished: data.status === "published",
      };

      let response;
      if (dialogMode === "edit" && selectedBlog) {
        response = await ContentService.updateBlog(selectedBlog._id, blogData);
      } else {
        response = await ContentService.createBlog(blogData);
      }

      if (response.success) {
        toast.success(
          `Blog ${dialogMode === "edit" ? "updated" : "created"} successfully`
        );
        setIsDialogOpen(false);
        fetchBlogs();
      } else {
        toast.error(response.message || `Failed to ${dialogMode} blog`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handleImagesUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const selected = Array.from(files).filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" is not an image file`);
        return false;
      }
      if (file.size > 3 * 1024 * 1024) {
        toast.error(`"${file.name}" is larger than 3MB`);
        return false;
      }
      return true;
    });

    if (selected.length === 0) return;

    setUploading(true);
    try {
      const dataUrls: string[] = [];
      for (const file of selected) {
        dataUrls.push(await fileToDataUrl(file));
      }

      const res = await apiService.post("/uploads", { dataUrls });
      const urls = (res.data as { urls?: string[] } | undefined)?.urls || [];

      if (!res.success || urls.length === 0) {
        toast.error(res.message || "Image upload failed");
        return;
      }

      const currentImages = watch("images") || [];
      const newList = [...currentImages, ...urls];
      setValue("images", newList);

      if (!watch("image") && newList.length > 0) {
        setValue("image", newList[0]);
      }

      toast.success(`${urls.length} image(s) uploaded successfully`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const removeImage = (url: string) => {
    const newList = (watch("images") || []).filter((img) => img !== url);
    setValue("images", newList);
    if (watch("image") === url) {
      setValue("image", newList.length > 0 ? newList[0] : "");
    }
  };

  const getStatusBadge = (status: string) => (
    <Badge variant={status === "published" ? "default" : "secondary"}>
      {status === "published" ? "Published" : "Draft"}
    </Badge>
  );

  const columns = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium">{value}</p>
          {row.excerpt && (
            <p className="text-sm text-gray-500 truncate max-w-md">
              {row.excerpt}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: "tags",
      label: "Tags",
      render: (value: string[] | string) => (
        <div className="flex flex-wrap gap-1">
          {(Array.isArray(value) ? value : [])
            .slice(0, 3)
            .map((tag: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          {(Array.isArray(value) ? value : []).length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{(Array.isArray(value) ? value : []).length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "author",
      label: "Author",// eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (value: any) => value?.name || "Unknown",
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const BlogDetails = ({ blog }: { blog: any }) => (
    <div className="space-y-6" data-testid="blog-details">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-2xl font-bold">{blog.title}</h2>
        {getStatusBadge(blog.status)}
      </div>

      {((blog.image && blog.image) || blog.images?.length) && (
        <div>
          <Label className="text-sm font-medium text-gray-500">
            Images ({blog.images?.length || 1})
          </Label>
          <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Array.isArray(blog.images) && blog.images.length > 0
              ? blog.images
              : blog.image
                ? [blog.image]
                : []
            ).map((img: string, index: number) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={index}
                src={img}
                alt={`${blog.title} image ${index + 1}`}
                className="w-full h-32 object-cover rounded-md border border-gray-200"
              />
            ))}
          </div>
        </div>
      )}

      {blog.category && (
        <div>
          <Label className="text-sm font-medium text-gray-500">Category</Label>
          <p className="mt-1 text-sm capitalize text-gray-700">
            {blog.category}
          </p>
        </div>
      )}

      {blog.excerpt && (
        <div>
          <Label className="text-sm font-medium text-gray-500">Excerpt</Label>
          <p className="mt-1 text-sm italic text-gray-700">{blog.excerpt}</p>
        </div>
      )}

      <div>
        <Label className="text-sm font-medium text-gray-500">Content</Label>
        <div className="mt-1 prose max-w-none">
          <div
            className="text-sm whitespace-pre-wrap"
            dangerouslySetInnerHTML={{
              __html: blog.content || "No content available",
            }}
          />
        </div>
      </div>

      {blog.tags && Array.isArray(blog.tags) && blog.tags.length > 0 && (
        <div>
          <Label className="text-sm font-medium text-gray-500">Tags</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {blog.tags.map((tag: string, index: number) => (
              <Badge key={index} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
        <div>
          <Label className="text-sm font-medium text-gray-500">Author</Label>
          <p className="font-medium">{blog.author?.name || "Unknown"}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-500">
            Created At
          </Label>
          <p className="font-medium">
            {new Date(blog.createdAt).toLocaleString()}
          </p>
        </div>
        {blog.updatedAt && (
          <>
            <div>
              <Label className="text-sm font-medium text-gray-500">
                Updated At
              </Label>
              <p className="font-medium">
                {new Date(blog.updatedAt).toLocaleString()}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <RoleGuard allowedRoles={["admin", "moderator"]}>
      <div className="space-y-6" data-testid="blogs-page">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Blog Management
            </h1>
            <p className="text-muted-foreground">
              Create and manage blog posts and articles
            </p>
          </div>
          <Button onClick={handleCreate} data-testid="create-blog-btn">
            <Plus className="h-4 w-4 mr-2" />
            Create Blog Post
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Posts
                  </p>
                  <p className="text-2xl font-bold">{blogs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-2xl font-bold">
                    {// eslint-disable-next-line @typescript-eslint/no-explicit-any
                      blogs.filter((blog: any) => blog.status === "published")
                        .length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Edit className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Drafts</p>
                  <p className="text-2xl font-bold">
                    {// eslint-disable-next-line @typescript-eslint/no-explicit-any
                      blogs.filter((blog: any) => blog.status === "draft")
                        .length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    This Month
                  </p>
                  <p className="text-2xl font-bold">
                    {
                      blogs.filter(// eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (blog: any) =>
                          new Date(blog.createdAt).getMonth() ===
                          new Date().getMonth()
                      ).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DataTable
          title="Blog Posts"
          data={blogs}
          columns={columns}
          searchKeys={["title", "content", "tags"]}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
          loading={loading}
          actions={[
            {
              label: "View Post",
              onClick: handleView,
              variant: "default",
            },
            {
              label: "Edit Post",
              onClick: handleEdit,
              variant: "default",
            },
            {
              label: "Delete Post",
              onClick: handleDelete,
              variant: "destructive",
            },
          ]}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "create" && "Create Blog Post"}
                {dialogMode === "edit" && "Edit Blog Post"}
                {dialogMode === "view" && "Blog Post Details"}
              </DialogTitle>
            </DialogHeader>

            {dialogMode === "view" && selectedBlog ? (
              <BlogDetails blog={selectedBlog} />
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    {...register("title", { required: "Title is required" })}
                    placeholder="Blog post title"
                    data-testid="blog-title-input"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    {...register("excerpt")}
                    placeholder="Brief description of the blog post"
                    rows={3}
                    data-testid="blog-excerpt-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Images (Featured Image Gallery)</Label>
                  <div className="flex flex-col gap-3">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      data-testid="blog-image-input"
                      onChange={(e) => handleImagesUpload(e.target.files)}
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploading}
                        onClick={() => imageInputRef.current?.click()}
                        data-testid="blog-image-upload-btn"
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ImagePlus className="h-4 w-4 mr-2" />
                        )}
                        {uploading ? "Uploading..." : "Upload Images"}
                      </Button>
                      {imageValue && imagesValue.length > 0 && (
                        <span className="text-xs text-gray-500">
                          First image or selected cover shows as the featured
                          image.
                        </span>
                      )}
                    </div>

                    {imagesValue.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {imagesValue.map((url, index) => (
                          <div
                            key={index}
                            className={`relative rounded-md border overflow-hidden group ${
                              imageValue === url
                                ? "border-primary ring-2 ring-primary"
                                : "border-gray-200"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`Blog image ${index + 1}`}
                              className="w-full h-24 object-cover"
                            />
                            {imageValue === url && (
                              <span className="absolute top-1 left-1 bg-primary text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                                Cover
                              </span>
                            )}
                            <div className="absolute inset-x-0 bottom-0 flex justify-between p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/70 to-transparent">
                              {imageValue !== url && (
                                <button
                                  type="button"
                                  title="Set as cover"
                                  onClick={() => setValue("image", url)}
                                  className="text-white text-[10px] font-medium px-1.5 py-0.5 rounded hover:bg-white/20"
                                >
                                  Cover
                                </button>
                              )}
                              <button
                                type="button"
                                title="Remove image"
                                onClick={() => removeImage(url)}
                                className="text-white text-[10px] font-medium px-1.5 py-0.5 rounded hover:bg-white/20 ml-auto"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <BlogRichEditor
                    key={`${dialogMode}-${selectedBlog?._id || "new"}`}
                    value={contentValue}
                    onChange={(html) => setValue("content", html)}
                    gallery={imagesValue}
                  />
                  {errors.content && (
                    <p className="text-sm text-red-600">
                      {errors.content.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      {...register("category")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      data-testid="blog-category-select"
                    >
                      <option value="service">Service</option>
                      <option value="news">News</option>
                      <option value="update">Update</option>
                      <option value="promotion">Promotion</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      {...register("tags")}
                      placeholder="Tags separated by commas"
                      data-testid="blog-tags-input"
                    />
                    <p className="text-xs text-gray-500">
                      Separate tags with commas
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    {...register("status")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    data-testid="blog-status-select"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                <div className="flex flex-wrap justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="blog-form-cancel"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="blog-form-submit">
                    {dialogMode === "edit" ? "Update Post" : "Create Post"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
