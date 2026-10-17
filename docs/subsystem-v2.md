flowchart TB
%% ==========================================
%% STYLING DEFINITIONS
%% ==========================================
    classDef frontendSub fill:#e3f2fd,stroke:#90caf9,stroke-width:2px;
    classDef backendSub fill:#f3e5f5,stroke:#ce93d8,stroke-width:2px;
    classDef persistenceSub fill:#e8f5e9,stroke:#a5d6a7,stroke-width:2px;

    classDef containerBox fill:#fff9c4,stroke:#fbc02d,stroke-width:1px;
    classDef subContainerBox fill:#fffde7,stroke:#fff59d,stroke-width:1px;
    classDef itemBox fill:#ffffff,stroke:#b0bec5,stroke-width:1px;
    classDef authBox fill:#ffe0b2,stroke:#ffb74d,stroke-width:1px;
    classDef layoutBox fill:#e8eaf6,stroke:#c5cae9,stroke-width:1px;
    classDef routeBox fill:#ede7f6,stroke:#d1c4e9,stroke-width:1px;
    classDef controllerBox fill:#fce4ec,stroke:#f48fb1,stroke-width:1px;
    classDef middlewareBox fill:#fff3e0,stroke:#ffcc80,stroke-width:1px;
    classDef serviceBox fill:#fffde7,stroke:#dce775,stroke-width:1px;
    classDef nosqlBox fill:#e8f8f5,stroke:#a3e4d7,stroke-width:1px;
    classDef sqlBox fill:#fbeee6,stroke:#edbb99,stroke-width:1px;

    %% Class Khusus Fitur Baru
    classDef newFeature fill:#ffebee,stroke:#e53935,stroke-width:2px,stroke-dasharray: 4 4;

%% ==========================================
%% FRONTEND SUBSYSTEM (React / Vite)
%% ==========================================
    subgraph FRONTEND ["FRONTEND SUBSYSTEM (React / Vite)"]
        MAIN["main.jsx / App.jsx"]:::itemBox
        AUTH_CTX["authContext.jsx<br/>(State & JWT Storage)"]:::authBox

        subgraph PUBLIC_PAGES ["Public Views (Unauthenticated)"]
            P_FORGOT["[BARU] ForgotPassword.jsx &<br/>ResetPassword.jsx"]:::newFeature
        end

        subgraph LAYOUTS ["Role-Based Layouts"]
            L_MHS["LayoutMhs"]:::layoutBox
            L_ADMIN["LayoutAdmin"]:::layoutBox
            L_ASDOS["LayoutAsdos"]:::layoutBox
        end

        subgraph VIEWS_SHARED ["Views & Shared"]
            subgraph PAGES ["Pages (Admin / Asdos / Mhs)"]
                PAGE_CORE["Dashboard, Kelas,<br/>Materi, Tugas, Presensi"]:::itemBox
                P_FAQ["[BARU] Faq.jsx<br/>(Static Front-End Only)"]:::newFeature
                P_SUPPORT_MHS["[BARU] ContactSupport.jsx<br/>(Mahasiswa Form)"]:::newFeature
                P_SUPPORT_ADM["[BARU] ManageSupportTickets.jsx<br/>(Admin Management)"]:::newFeature
            end
            COMPONENTS["Components / Hooks / Utils"]:::itemBox
        end

        AXIOS["axiosInstance.js<br/>(Interceptor Layer)"]:::itemBox
    end

%% ==========================================
%% BACKEND API SUBSYSTEM (Node.js / Express)
%% ==========================================
    subgraph BACKEND ["BACKEND API SUBSYSTEM (Node.js / Express)"]
        subgraph ROUTING ["API Routing"]
            R_SUB["submissionRoutes"]:::routeBox
            R_CONTENT["contentRoutes"]:::routeBox
            R_USER["userRoutes"]:::routeBox
            R_ADMIN["adminRoutes"]:::routeBox
            R_AUTH["authRoutes<br/>[EXTENDED: Forgot Pwd]"]:::routeBox
            R_SETTING["[BARU] settingRoutes<br/>(Contact Info)"]:::newFeature
        end

        subgraph CONTROLLERS ["Controllers (Business Logic)"]
            C_SUB["submissionController"]:::controllerBox
            C_CONTENT["contentController"]:::controllerBox
            C_USER["userController"]:::controllerBox
            C_PRAKT["praktikumController"]:::controllerBox
            C_AUTH["authController<br/>[EXTENDED: Reset Token]"]:::controllerBox
            C_SETTING["[BARU] systemSettingController"]:::newFeature
        end

        subgraph SERVICES ["Service Layer (Future Scaling)"]
            S_AUTH["authService"]:::serviceBox
            S_GRADE["gradingService"]:::serviceBox
            S_PRAKT["praktikumService"]:::serviceBox
            S_MAIL["[BARU] emailService<br/>(Nodemailer)"]:::newFeature
            S_SETTING["[BARU] systemSettingService"]:::newFeature
        end

        subgraph MIDDLEWARE ["Middleware & Security"]
            M_RBAC["rbacMiddleware"]:::middlewareBox
            M_ENROLL["enrollmentMiddleware"]:::middlewareBox
            M_AUTH["authMiddleware"]:::middlewareBox
            M_UPLOAD["uploadMiddleware"]:::middlewareBox
            M_ERROR["errorHandler"]:::middlewareBox
        end
    end

%% ==========================================
%% PERSISTENCE SUBSYSTEM (Polyglot)
%% ==========================================
    subgraph PERSISTENCE ["PERSISTENCE SUBSYSTEM (Polyglot)"]
        subgraph LOCAL_STORAGE ["Local Storage"]
            UPLOADS[("Local Storage<br/>(/uploads)")]:::itemBox
        end

        subgraph NOSQL ["MongoDB (Unstructured Documents)"]
            DOC_PENGUMPULAN[("Pengumpulan")]:::nosqlBox
            DOC_TUGAS[("Tugas")]:::nosqlBox
            DOC_MATERI[("Materi")]:::nosqlBox
        end

        subgraph SQL ["MariaDB (Relational Master Data)"]
            T_PUR[("PraktikumUserRole")]:::sqlBox
            T_PERTEMUAN[("Pertemuan")]:::sqlBox
            T_PRAKTIKUM[("Praktikum")]:::sqlBox
            T_PRE_STATUS[("PresensiStatus")]:::sqlBox
            T_ROLE[("Role")]:::sqlBox
            T_USER[("User")]:::sqlBox
            T_USER_ROLE[("UserRole")]:::sqlBox
            T_PRESENSI[("Presensi")]:::sqlBox
            T_PWD_RESET[("[BARU] PasswordResets")]:::newFeature
            T_SYS_SETTINGS[("[BARU] SystemSettings")]:::newFeature
        end
    end

%% ==========================================
%% RELATIONS & DATA FLOW
%% ==========================================
    %% Frontend Internal Flow
    MAIN --> AUTH_CTX
    MAIN -.-> P_FORGOT
    AUTH_CTX -- "Protects" --> LAYOUTS
    AUTH_CTX -. "Injects Token" .-> AXIOS
    L_MHS --> VIEWS_SHARED
    L_ADMIN --> VIEWS_SHARED
    L_ASDOS --> VIEWS_SHARED
    PAGES --> COMPONENTS
    COMPONENTS --> AXIOS
    P_FORGOT --> AXIOS

    %% Frontend to Backend
    AXIOS ==>|HTTP/REST (Bearer Token)| BACKEND

    %% Backend Routing Flow
    BACKEND --> ROUTING
    R_SUB --> C_SUB
    R_CONTENT --> C_CONTENT
    R_USER --> C_USER
    R_ADMIN --> C_PRAKT
    R_AUTH --> C_AUTH
    R_SETTING --> C_SETTING

    %% Middleware Interceptions & Error Handling
    BACKEND -- "Validates" --> M_AUTH
    M_AUTH -.-> M_RBAC
    C_SUB -. "Throws Error" .-> M_ERROR
    C_CONTENT -. "Throws Error" .-> M_ERROR
    C_SETTING -. "Throws Error" .-> M_ERROR
    C_AUTH -. "Throws Error" .-> M_ERROR

    %% Controller to Services
    C_AUTH -- "Offloads Mail Job" --> S_MAIL
    C_AUTH -- "Offloads Work" --> S_AUTH
    C_SUB -- "Offloads Work" --> S_GRADE
    C_PRAKT -- "Offloads Work" --> S_PRAKT
    C_SETTING -- "Offloads Work" --> S_SETTING

    %% Controller to Persistence (Existing)
    C_SUB -->|File Stream| UPLOADS
    C_SUB -->|CRUD| DOC_PENGUMPULAN
    C_CONTENT -->|CRUD| DOC_MATERI
    C_CONTENT -->|CRUD| DOC_TUGAS
    C_USER -->|CRUD| T_USER
    C_PRAKT -->|CRUD| T_PRAKTIKUM
    C_PRAKT -->|Validate Context| T_PERTEMUAN
    C_PRAKT -->|Validate Context| T_PUR

    %% [BARU] Controller to Persistence (New Features)
    C_SETTING -->|CRUD Settings & Phone| T_SYS_SETTINGS
    C_AUTH -->|Write Reset Token| T_PWD_RESET
    C_AUTH -->|Verify Token & Update Pwd| T_USER

%% Apply Subsystem Background Styles
    class FRONTEND frontendSub;
    class BACKEND backendSub;
    class PERSISTENCE persistenceSub;
    class LAYOUTS,VIEWS_SHARED,PAGES,PUBLIC_PAGES containerBox;
    class ROUTING,CONTROLLERS,SERVICES,MIDDLEWARE subContainerBox;
    class LOCAL_STORAGE,NOSQL,SQL subContainerBox;