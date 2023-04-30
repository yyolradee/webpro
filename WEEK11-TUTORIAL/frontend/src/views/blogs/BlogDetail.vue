<template>
    <div class="container is-widescreen">
        <section class="hero">
            <div class="hero-body">
                <p class="title">
                    {{ blog.title }}
                </p>
            </div>
        </section>
        <section class="section" id="app">
            <div class="content">
                <div class="card has-background-light">
                    <div class="card-image pt-5">
                        <div class="columns">
                            <div class="column" v-for="img in images" :key="img.id">
                                <figure class="image">
                                    <img :src="img.file_path ? `http://localhost:3000/${blog.file_path}` : 'https://bulma.io/images/placeholders/480x480.png'" alt="Placeholder image" />
                                </figure>
                            </div>
                        </div>

                    </div>
                    <div class="card-content">
                        <div class="content">
                            {{ blog.content }}
                        </div>
                        <div class="container">
                            <p class="subtitle">Comments</p>
                            <div class="box" v-for="comment in comments" :key="comment.id">
                                <article class="media">
                                    <div class="media-left">
                                        <figure class="image is-64x64">
                                            <img src="https://bulma.io/images/placeholders/128x128.png" alt="Image">
                                        </figure>
                                    </div>
                                    <div class="media-content">
                                        <div class="content">
                                            <p>
                                                {{ comment.comment }}
                                            </p>
                                            <p class="is-size-7">
                                                {{ comment.comment_date }}
                                            </p>
                                        </div>
                                        <nav class="level is-mobile">
                                            <div class="level-left">
                                                <a class="level-item" aria-label="like">
                                                    <span class="icon is-small">
                                                        <i class="fas fa-heart" aria-hidden="true"></i>
                                                    </span>
                                                </a>
                                            </div>
                                        </nav>
                                    </div>
                                </article>
                            </div>
                            <form>
                                <div class="columns box">
                                    <div class="column is-7">
                                        <input class="input" type="text" name="comment" placeholder="Comment here..."
                                            value="" v-model="comment">
                                    </div>
                                    <div class="column is-3">
                                        <div class="file">
                                            <label class="file-label">
                                                <input class="file-input" type="file" name="comment_image" @change="handleFileUpload()">
                                                <span class="file-cta">
                                                    <span class="file-icon">
                                                        <i class="fas fa-upload"></i>
                                                    </span>
                                                    <span class="file-label">
                                                        Choose an image…
                                                    </span>
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                    <div class="column is-2">
                                        <input class="button is-primary" type="submit" value="Submit" @click="addComment()">
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                    <footer class="card-footer">
                        <a class="card-footer-item" href="/">To Home Page</a>
                    </footer>
                </div>
            </div>
        </section>
    </div>
</template>

<script>
import axios from "axios";

export default {
    data() {
        return {
            id: null,
            blog: null,
            images: null,
            comments: null,
            comment: null,
            file: null,
        }
    },
    created() {
        this.id = this.$route.params.id
        axios.get(`http://localhost:3000/blogs/${this.id}`)
            .then((response) => {
                console.log(response)
                this.blog = response.data.blog
                this.images = response.data.images
                this.comments = response.data.comments
            })
            .catch((err) => {
                console.log(err);
            })
    },
    methods: {
        handleFileUpload() {
            this.file = this.$refs.file.files[0];
        },
        addComment() {
            var formData = new FormData();
            formData.append("comment", this.comment);
            formData.append("comment_image", this.file);
            axios.post(`http://localhost:3000/${this.id}/comments`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }).then(response => {
                console.log(response)
                this.$forceUpdate();
            }).catch(error => {
                console.log(error.message);
            });
        }
    }
}
</script>
