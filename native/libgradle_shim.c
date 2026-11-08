#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <dlfcn.h>
#include <poll.h>

static int (*real_accept)(int, struct sockaddr *, socklen_t *) = NULL;
static int (*real_accept4)(int, struct sockaddr *, socklen_t *, int) = NULL;

static void log_shim(const char *msg) {
    FILE *f = fopen("/tmp/shim.log", "a");
    if (f) {
        fprintf(f, "[shim] %s\n", msg);
        fclose(f);
    }
}

static int filter_probe(int fd) {
    if (fd < 0) return fd;

    // Wait up to 1000ms for incoming data on the newly accepted socket
    struct pollfd pfd;
    pfd.fd = fd;
    pfd.events = POLLIN;
    int ret = poll(&pfd, 1, 1000);

    if (ret > 0 && (pfd.revents & POLLIN)) {
        char buf[8] = {0};
        ssize_t n = recv(fd, buf, 4, MSG_PEEK);
        if (n > 0) {
            // Check if it's an HTTP probe (HEAD, GET, POST, OPTI)
            if (buf[0] == 'H' || buf[0] == 'G' || buf[0] == 'P' || buf[0] == 'O') {
                log_shim("Intercepted HTTP probe on daemon socket! Sending 200 OK and closing.");
                char drain[2048];
                recv(fd, drain, sizeof(drain), 0);
                const char *resp = "HTTP/1.1 200 OK\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
                send(fd, resp, strlen(resp), 0);
                close(fd);
                return -1; // Filtered: ask accept to fetch next real connection
            } else {
                char msg[64];
                snprintf(msg, sizeof(msg), "Passing binary connection, first byte: 0x%02x (%d)", (unsigned char)buf[0], (int)buf[0]);
                log_shim(msg);
            }
        }
    } else {
        log_shim("Poll timed out with no data");
    }
    return fd;
}

int accept(int sockfd, struct sockaddr *addr, socklen_t *addrlen) {
    if (!real_accept) {
        real_accept = dlsym(RTLD_NEXT, "accept");
    }
    while (1) {
        int client = real_accept(sockfd, addr, addrlen);
        if (client < 0) return client;
        int res = filter_probe(client);
        if (res >= 0) return res;
    }
}

int accept4(int sockfd, struct sockaddr *addr, socklen_t *addrlen, int flags) {
    if (!real_accept4) {
        real_accept4 = dlsym(RTLD_NEXT, "accept4");
    }
    while (1) {
        int client = real_accept4(sockfd, addr, addrlen, flags);
        if (client < 0) return client;
        int res = filter_probe(client);
        if (res >= 0) return res;
    }
}


