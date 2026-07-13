--
-- PostgreSQL database dump
--

\restrict Kzs5xuQg3DD3ngPO8zg3n1Y7ac4qYVDAOWNyvRh0iBkaRevmDwQcXXePVclTS52

-- Dumped from database version 15.18 (Debian 15.18-1.pgdg13+1)
-- Dumped by pg_dump version 15.18 (Debian 15.18-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bin_contents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bin_contents (
    id integer NOT NULL,
    bin_id character varying NOT NULL,
    trash_type character varying NOT NULL,
    total_weight_kg double precision,
    item_count integer,
    last_updated timestamp without time zone
);


ALTER TABLE public.bin_contents OWNER TO postgres;

--
-- Name: bin_contents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bin_contents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.bin_contents_id_seq OWNER TO postgres;

--
-- Name: bin_contents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bin_contents_id_seq OWNED BY public.bin_contents.id;


--
-- Name: regions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.regions (
    id integer NOT NULL,
    name character varying NOT NULL,
    description character varying
);


ALTER TABLE public.regions OWNER TO postgres;

--
-- Name: regions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.regions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.regions_id_seq OWNER TO postgres;

--
-- Name: regions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.regions_id_seq OWNED BY public.regions.id;


--
-- Name: rewards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rewards (
    id integer NOT NULL,
    name character varying NOT NULL,
    points_required integer NOT NULL
);


ALTER TABLE public.rewards OWNER TO postgres;

--
-- Name: rewards_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rewards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rewards_id_seq OWNER TO postgres;

--
-- Name: rewards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rewards_id_seq OWNED BY public.rewards.id;


--
-- Name: sensor_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sensor_logs (
    id integer NOT NULL,
    bin_id character varying NOT NULL,
    "timestamp" timestamp without time zone,
    gps_lat double precision NOT NULL,
    gps_long double precision NOT NULL,
    trash_type character varying NOT NULL,
    weight_kg double precision NOT NULL,
    volume_percent integer NOT NULL,
    volume_liters double precision
);


ALTER TABLE public.sensor_logs OWNER TO postgres;

--
-- Name: sensor_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sensor_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sensor_logs_id_seq OWNER TO postgres;

--
-- Name: sensor_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sensor_logs_id_seq OWNED BY public.sensor_logs.id;


--
-- Name: smart_bins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.smart_bins (
    bin_id character varying NOT NULL,
    location_name character varying NOT NULL,
    gps_lat double precision NOT NULL,
    gps_long double precision NOT NULL,
    status character varying,
    capacity_percent integer,
    total_volume_liters double precision,
    filled_volume_liters double precision,
    last_updated character varying,
    region_id integer,
    owner_id integer
);


ALTER TABLE public.smart_bins OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    points integer,
    role character varying,
    refresh_token character varying
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: bin_contents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bin_contents ALTER COLUMN id SET DEFAULT nextval('public.bin_contents_id_seq'::regclass);


--
-- Name: regions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regions ALTER COLUMN id SET DEFAULT nextval('public.regions_id_seq'::regclass);


--
-- Name: rewards id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rewards ALTER COLUMN id SET DEFAULT nextval('public.rewards_id_seq'::regclass);


--
-- Name: sensor_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensor_logs ALTER COLUMN id SET DEFAULT nextval('public.sensor_logs_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: bin_contents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bin_contents (id, bin_id, trash_type, total_weight_kg, item_count, last_updated) FROM stdin;
\.


--
-- Data for Name: regions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.regions (id, name, description) FROM stdin;
1	Kawasan Jakarta Pusat	Area sekitar Monas dan Thamrin
\.


--
-- Data for Name: rewards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rewards (id, name, points_required) FROM stdin;
\.


--
-- Data for Name: sensor_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sensor_logs (id, bin_id, "timestamp", gps_lat, gps_long, trash_type, weight_kg, volume_percent, volume_liters) FROM stdin;
\.


--
-- Data for Name: smart_bins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.smart_bins (bin_id, location_name, gps_lat, gps_long, status, capacity_percent, total_volume_liters, filled_volume_liters, last_updated, region_id, owner_id) FROM stdin;
BIN_001	Taman Suropati	-6.199	106.832	active	20	100	0	\N	1	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, points, role, refresh_token) FROM stdin;
1	Admin DLHK	admin@dlhk.go.id	$2b$12$vl3vMkvLMM5puXwnZI5EHehsExCreqSC4H.tv7C/iztgi/y/b6bbi	0	admin	\N
2	Budi Warga	warga@test.com	$2b$12$vl3vMkvLMM5puXwnZI5EHehsExCreqSC4H.tv7C/iztgi/y/b6bbi	150	warga	\N
\.


--
-- Name: bin_contents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bin_contents_id_seq', 1, false);


--
-- Name: regions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.regions_id_seq', 1, true);


--
-- Name: rewards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rewards_id_seq', 1, false);


--
-- Name: sensor_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sensor_logs_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: bin_contents bin_contents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bin_contents
    ADD CONSTRAINT bin_contents_pkey PRIMARY KEY (id);


--
-- Name: regions regions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (id);


--
-- Name: rewards rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT rewards_pkey PRIMARY KEY (id);


--
-- Name: sensor_logs sensor_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensor_logs
    ADD CONSTRAINT sensor_logs_pkey PRIMARY KEY (id);


--
-- Name: smart_bins smart_bins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smart_bins
    ADD CONSTRAINT smart_bins_pkey PRIMARY KEY (bin_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_bin_contents_bin_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_bin_contents_bin_id ON public.bin_contents USING btree (bin_id);


--
-- Name: ix_bin_contents_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_bin_contents_id ON public.bin_contents USING btree (id);


--
-- Name: ix_bin_contents_trash_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_bin_contents_trash_type ON public.bin_contents USING btree (trash_type);


--
-- Name: ix_regions_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_regions_id ON public.regions USING btree (id);


--
-- Name: ix_regions_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_regions_name ON public.regions USING btree (name);


--
-- Name: ix_rewards_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_rewards_id ON public.rewards USING btree (id);


--
-- Name: ix_sensor_logs_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_sensor_logs_id ON public.sensor_logs USING btree (id);


--
-- Name: ix_smart_bins_bin_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_smart_bins_bin_id ON public.smart_bins USING btree (bin_id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: bin_contents bin_contents_bin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bin_contents
    ADD CONSTRAINT bin_contents_bin_id_fkey FOREIGN KEY (bin_id) REFERENCES public.smart_bins(bin_id);


--
-- Name: smart_bins smart_bins_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smart_bins
    ADD CONSTRAINT smart_bins_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: smart_bins smart_bins_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smart_bins
    ADD CONSTRAINT smart_bins_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id);


--
-- PostgreSQL database dump complete
--

\unrestrict Kzs5xuQg3DD3ngPO8zg3n1Y7ac4qYVDAOWNyvRh0iBkaRevmDwQcXXePVclTS52

