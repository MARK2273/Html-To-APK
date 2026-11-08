#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <dlfcn.h>
#include <poll.h>

static int (*real_accept)(int, struct sockaddr *, socklen_t *) = NULL;
static int (*real_accept4)(int, struct sockaddr *, socklen_t *, int) = NULL;

static int is_web_server_port(int sockfd) {
    struct sockaddr_in sin;
    socklen_t len = sizeof(sin);
    if (getsockname(sockfd, (struct sockaddr *)&sin, &len) == 0) {
        int port = ntohs(sin.sin_port);
        const char *env_port = getenv("PORT");
        int web_port = env_port ? atoi(env_port) : 10000;
        if (port == web_port || port == 3000 || port == 80 || port == 8080) {
            return 1;
        }
    }
    return 0;
}

static int filter_probe(int sockfd, int client_fd) {
    if (client_fd < 0) return client_fd;

    // Never filter the main web server port
    if (is_web_server_port(sockfd)) {
        return client_fd;
    }

    // Wait up to 500ms for incoming data on newly accepted socket
    struct pollfd pfd;
    pfd.fd = client_fd;
    pfd.events = POLLIN;
    int ret = poll(&pfd, 1, 500);

    if (ret > 0 && (pfd.revents & POLLIN)) {
        char buf[8] = {0};
        ssize_t n = recv(client_fd, buf, 4, MSG_PEEK);
        if (n >= 4 && (memcmp(buf, "HEAD", 4) == 0 || memcmp(buf, "GET ", 4) == 0)) {
            char drain[1024];
            recv(client_fd, drain, sizeof(drain), 0);
            const char *resp = "HTTP/1.1 200 OK\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
            send(client_fd, resp, strlen(resp), 0);
            close(client_fd);
            return -1; // Filtered: ask accept to fetch next real connection
        }
    }
    return client_fd;
}

int accept(int sockfd, struct sockaddr *addr, socklen_t *addrlen) {
    if (!real_accept) real_accept = dlsym(RTLD_NEXT, "accept");
    while (1) {
        int client = real_accept(sockfd, addr, addrlen);
        if (client < 0) return client;
        int res = filter_probe(sockfd, client);
        if (res >= 0) return res;
    }
}

int accept4(int sockfd, struct sockaddr *addr, socklen_t *addrlen, int flags) {
    if (!real_accept4) real_accept4 = dlsym(RTLD_NEXT, "accept4");
    while (1) {
        int client = real_accept4(sockfd, addr, addrlen, flags);
        if (client < 0) return client;
        int res = filter_probe(sockfd, client);
        if (res >= 0) return res;
    }
}



