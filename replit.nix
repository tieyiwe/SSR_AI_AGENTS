{ pkgs }: {
  deps = [
    # Python
    pkgs.python311
    pkgs.python311Packages.pip
    pkgs.python311Packages.virtualenv

    # Node.js
    pkgs.nodejs_20
    pkgs.nodePackages.npm

    # System libraries needed by Python packages
    pkgs.openssl
    pkgs.libffi
    pkgs.zlib
    pkgs.gcc
    pkgs.pkg-config

    # PostgreSQL client (for psycopg2 / asyncpg)
    pkgs.postgresql_15

    # Utilities
    pkgs.curl
    pkgs.bash
  ];

  env = {
    PYTHON_LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
      pkgs.openssl
      pkgs.libffi
      pkgs.zlib
    ];
    PYTHONBIN = "${pkgs.python311}/bin/python3.11";
    LANG = "en_US.UTF-8";
  };
}
