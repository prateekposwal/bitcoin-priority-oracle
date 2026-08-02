/*
 * SCCR Reproduction — standalone C implementation (third independent language).
 *
 * Computes the Storage Cost Coverage Ratio (SCCR) for every block in the frozen
 * fee_history capture, reading ONLY:
 *   1. research/model-spec.json                          (canonical constants)
 *   2. research/reproduce/input/fee_history_capture.json (frozen live capture)
 *
 * Formula (model-spec v2.0.1, identical to storage-ratio.js and
 * reproduce_sccr.py):
 *     R_blocks = 365.25 * 24 * 6
 *     cb       = C / (B_block * R_blocks)
 *     L_node   = B_block * cb * T
 *     L_net    = L_node * N
 *     SCCR_i   = (avgFees_i / 1e8 * USD_i) / L_net
 *
 * Build & run:
 *     gcc -O2 -o reproduce_sccr reproduce_sccr.c -lm
 *     ./reproduce_sccr /path/to/repo
 *
 * No third-party JSON library: the two inputs are known, controlled files,
 * so a minimal key:number extractor is sufficient and honest.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

static const char *skip_ws(const char *p) {
    while (*p == ' ' || *p == '\t' || *p == '\n' || *p == '\r') p++;
    return p;
}

/* Find '"key"' in text from `from`, return pointer to char after the closing
 * quote of the key (i.e., pointing at ':' after ws), or NULL. */
static const char *find_key(const char *text, const char *from, const char *key) {
    size_t klen = strlen(key);
    const char *p = from ? from : text;
    while ((p = strstr(p, key)) != NULL) {
        if (p == text || p[-1] != '"') { p += klen; continue; }
        if (p[klen] != '"')            { p += klen; continue; }
        const char *q = skip_ws(p + klen + 1);
        if (*q != ':')                 { p += klen; continue; }
        return q;
    }
    return NULL;
}

/* Extract a number that is the value of "key" (either scalar or inside an
 * object as "value": num — model-spec stores constants as objects). */
static int json_get_number(const char *text, const char *key, double *out) {
    const char *colon = find_key(text, NULL, key);
    if (!colon) return 0;
    const char *q = skip_ws(colon + 1);
    if (*q == '{') {
        /* object: find nested "value" key inside */
        const char *v = find_key(text, q, "value");
        if (!v) return 0;
        q = skip_ws(v + 1);
    }
    *out = strtod(q, NULL);
    return 1;
}

static char *read_file(const char *path) {
    FILE *f = fopen(path, "rb");
    if (!f) { fprintf(stderr, "cannot open %s\n", path); exit(1); }
    fseek(f, 0, SEEK_END);
    long n = ftell(f);
    fseek(f, 0, SEEK_SET);
    char *buf = malloc((size_t)n + 1);
    if (!buf) { fprintf(stderr, "malloc failed\n"); exit(1); }
    size_t rd = fread(buf, 1, (size_t)n, f);
    buf[rd] = '\0';
    fclose(f);
    return buf;
}

int main(int argc, char **argv) {
    const char *base = ".";
    if (argc > 1) base = argv[1];           /* optional repo root */

    char spec_path[1024], cap_path[1024], out_path[1024];
    snprintf(spec_path, sizeof spec_path, "%s/research/model-spec.json", base);
    snprintf(cap_path, sizeof cap_path, "%s/research/reproduce/input/fee_history_capture.json", base);
    snprintf(out_path, sizeof out_path, "%s/research/reproduce/output/reproduce_sccr_c.json", base);

    char *spec = read_file(spec_path);
    char *cap  = read_file(cap_path);

    double C=0, N=0, T=0, B=0;
    if (!json_get_number(spec, "C", &C) || !json_get_number(spec, "N", &N) ||
        !json_get_number(spec, "T", &T) || !json_get_number(spec, "B_block", &B)) {
        fprintf(stderr, "model-spec.json: could not extract C/N/T/B_block\n");
        return 1;
    }

    double r_blocks = 365.25 * 24.0 * 6.0;
    double cb   = C / (B * r_blocks);              /* USD/(byte*yr) */
    double l_net = B * cb * T * N;                 /* USD/block      */

    /* Scan the capture array block by block: each element has keys
     * avgHeight, timestamp, avgFees, USD. Walk to each "avgFees" and read
     * the USD of the SAME array element (first "USD" after that avgFees). */
    double sum = 0.0, mn = 1e18, mx = -1e18;
    int blocks = 0, below = 0;
    const char *p = cap;
    while ((p = strstr(p, "avgFees")) != NULL) {
        double fee_sats = 0, usd = 0;
        const char *afe = find_key(cap, p, "avgFees");
        if (!afe) break;
        fee_sats = strtod(skip_ws(afe + 1), NULL);
        const char *usd_k = find_key(cap, afe, "USD");
        if (!usd_k) { p += 7; continue; }
        usd = strtod(skip_ws(usd_k + 1), NULL);
        double fee_usd = (fee_sats / 1e8) * usd;
        double ratio = fee_usd / l_net;
        sum += ratio;
        if (ratio < mn) mn = ratio;
        if (ratio > mx) mx = ratio;
        if (ratio < 1.0) below++;
        blocks++;
        p = usd_k + 3;  /* move past this element's USD value */
    }

    if (blocks == 0) { fprintf(stderr, "no blocks parsed\n"); return 1; }
    double avg = sum / blocks;

    printf("==============================================================\n");
    printf("  SCCR Reproduction (C) — research/reproduce_sccr.c\n");
    printf("  model-spec C=%.0f N=%.0f T=%.0f B=%.0f  capture blocks: %d\n",
           C, N, T, B, blocks);
    printf("==============================================================\n");
    printf("  Blocks sampled      : %d\n", blocks);
    printf("  Avg SCCR            : %.4f\n", avg);
    printf("  Min / Max           : %.4f / %.4f\n", mn, mx);
    printf("  Blocks below 1.0    : %d/%d (%.1f%%)\n", below, blocks, 100.0*below/blocks);
    printf("  L_net (USD/block)   : %.6f\n", l_net);
    printf("  cb  (USD/(byte*yr)) : %.6e\n", cb);

    FILE *out = fopen(out_path, "w");
    if (out) {
        fprintf(out, "{\n  \"implementation\": \"c\",\n");
        fprintf(out, "  \"spec_constants\": {\"C\": %.0f, \"N\": %.0f, \"T\": %.0f, \"B_block\": %.0f},\n", C, N, T, B);
        fprintf(out, "  \"blocks\": %d,\n", blocks);
        fprintf(out, "  \"avg_sccr\": %.6f,\n", avg);
        fprintf(out, "  \"min\": %.6f,\n", mn);
        fprintf(out, "  \"max\": %.6f,\n", mx);
        fprintf(out, "  \"below_1x\": %d,\n", below);
        fprintf(out, "  \"below_1x_pct\": %.2f,\n", 100.0*below/blocks);
        fprintf(out, "  \"l_net\": %.6f,\n", l_net);
        fprintf(out, "  \"cb\": %.6e\n}\n", cb);
        fclose(out);
    }
    printf("  wrote output/reproduce_sccr_c.json\n");
    return 0;
}
