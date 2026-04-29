# typed: false
# frozen_string_literal: true

class AnsiblePullBootstrap < Formula
  desc "Onboard a machine into nsheaps ansible-managed infrastructure"
  homepage "https://github.com/nsheaps/iac"
  url "https://github.com/nsheaps/brew-meta-formula/archive/refs/tags/v1.0.0.tar.gz"
  sha256 "b14702dd54ea5c48d2ebeb6425015c14794159a6b9d342178c81d2f2e79ed2db"
  version "1.0.0" # bump to trigger re-bootstrap
  license "MIT"

  livecheck do
    skip "Bootstrap runs from iac repo HEAD"
  end

  depends_on "ansible"
  depends_on "gh"

  def install
    # Brew needs something installed or it will complain about an empty installation
    system "touch", "trick-brew-to-install-meta-formula"
    prefix.install "trick-brew-to-install-meta-formula"

    # --- Perform the actual bootstrap ---
    repo = "nsheaps/iac"
    clone_dir = ENV.fetch("N8_IAC_DIR", "#{Dir.home}/src/iac")
    branch = ENV.fetch("N8_IAC_BRANCH", "main")

    # Ensure GitHub authentication
    unless quiet_system("gh", "auth", "status")
      ohai "GitHub authentication required for private repo access."
      ohai "Run `gh auth login` first, then reinstall this formula."
      odie "Not authenticated with GitHub CLI. Run `gh auth login` and retry."
    end

    # Clone or update the iac repo
    if File.directory?("#{clone_dir}/.git")
      ohai "Updating #{clone_dir}..."
      system "git", "-C", clone_dir, "pull", "origin", branch, "--ff-only"
    else
      ohai "Cloning #{repo} to #{clone_dir}..."
      mkdir_p File.dirname(clone_dir)
      system "gh", "repo", "clone", repo, clone_dir, "--", "--branch", branch
    end

    # Run ansible-pull to bootstrap this machine
    ohai "Running ansible-pull bootstrap..."
    Dir.chdir(clone_dir) do
      system "ansible-playbook",
             "ansible/playbooks/bootstrap.yml",
             "--connection", "local",
             "--inventory", "localhost,"
    end
  end

  def caveats
    <<~EOS
      This formula bootstraps the machine by:
        1. Cloning nsheaps/iac (via gh for private repo access)
        2. Running the ansible bootstrap playbook locally

      Prerequisites:
        gh auth login   # authenticate with GitHub first

      Environment variables:
        N8_IAC_DIR      Clone location (default: ~/src/iac)
        N8_IAC_BRANCH   Branch to use (default: main)

      To re-run the bootstrap, reinstall:
        brew reinstall ansible-pull-bootstrap
    EOS
  end

  test do
    assert_match "ansible-pull-bootstrap", name
  end
end
