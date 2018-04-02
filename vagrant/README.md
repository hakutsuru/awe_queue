Vagrant
=======

This directory houses the [Vagrant](http://www.vagrantup.com/) environments used for developing code within virtual machines running on your local host.

Note that all Ansible playbooks, roles, and group\_vars are stored under a common directory _\<path-to-project-repo\>/ansible/_ and are what these Vagrant environments use to provision themselves.

## Requirements

Before experimenting locally, you must have the following items installed and working:

* [VirtualBox](https://www.virtualbox.org/) >= v5.1.10
* [Vagrant](http://vagrantup.com/) = v1.8.6
* [Ansible](http://docs.ansible.com/intro_installation.html) = v2.2.0.0

If you're using a Mac, it's easiest to just: [`brew install ansible`](http://brew.sh)

Note: The version of Vagrant is important. There may be issues with a different version, but you are welcome to use whichever version tickles you...

## Troubleshooting

If you have been working with an environment and encounter issues without changing any code (in the application under test) -- here is what you need to know...

### Basic Information

Virtualbox simulates hardware, and is used to run virtual machines. As we have various environments, you cannot simply `vagrant status` to know about *every* instance running. Thus, you may need to check Virtualbox (via the application or its terminal commands, e.g. `VBoxManage list runningvms`). Do not delete an instance via Virtualbox unless you encounter difficulties with vagrant commands.

Vagrant is a tool used to manage virtual machines. Each environment consists of one or more virtual machines configured per the environment's vagrantfile, and any associated provisioning.

- `vagrant up` -- creates/wakes/boots your environment
- `vagrant suspend` -- sleeps your environment
- `vagrant halt` -- shuts down your environment
- `vagrant destroy`	-- tears down your environment
- `vagrant ssh <host>` -- connects to an instance
- `vagrant provision` -- updates your environment
- `vagrant reload` -- apply vagrantfile/hosts changes

Ansible is the provisioning tool used to install and configure software on instances of an environment.

### When your environment breaks

If provisioning does not solve your problem (or it would be complicated to manage any migration steps), the recommended course of action is to `vagrant destroy` and recreate your environment via `vagrant up`. If issues persist, alert the maintainer of the repo.
