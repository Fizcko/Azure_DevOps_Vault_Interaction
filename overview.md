## Vault Interaction
  This extension provide the ability to interact with [HashiCorp Vault](https://www.vaultproject.io/ "HashiCorp Vault's Homepage").

## Authentication methods available

  - AppRole
  - Azure
  - Client Token
  - LDAP
  - Radius
  - Username & Password

## Utilities

- ### Vault - Read KV secrets

  Provide the ability to read KV secrets from HashiCorp Vault and load them into variables.

  ## <span style="color:red">Note</span>  

  The field « Secret path » have to ends with a « / » if you want to discover secrets across current folder and his subfolders.
  See [Use case 2](#Use-case-2).
  In discovery mode if the « Prefix type » is set to « None » or « Custom » and you have secrets with the same name in different folder the last value read will be set in the variable (erasing previus values).

  ## __Examples__

  For the examples the following folder structure is created.

  ![Tree](screenshots/kv_read_00.png)

  « ALM » is a KV v2 engine.

  ![KV v2](screenshots/kv_read_01.png)

  « APP1 » and « APP2 » is two folders containing a subfolder « DEV » and two secret « key_1 » and « key_2 ».

  ![Secrets path](screenshots/kv_read_02.png)

  ## Use case 1
  
  Read secrets from a KV v2 engine called « ALM » located at path « APP1/DEV ».

  ![Azure DevOps configuation 1](screenshots/kv_read_03.png)

  ![Azure DevOps output log 1](screenshots/kv_read_04.png)

  There is now two variables called « APP1_key_1 » and « APP1_key_2 » that you can used in your next tasks by using $(APP1_key_1) and/or $(APP1_key_2).

  ## Use case 2
  
  Read secrets from a KV v2 engine called « ALM » and browse recursively on sub folders.

  ![Azure DevOps configuation 2](screenshots/kv_read_05.png)

  ![Azure DevOps configuation 2](screenshots/kv_read_06.png)

  There is now four variables called « APP1_DEV_key_1 », « APP1_DEV_key_2 », « APP2_DEV_key_1 », « APP2_DEV_key_2 » that you can used in your next tasks by using $(APP1_DEV_key_1), $(APP1_DEV_key_2), $(APP2_DEV_key_1), $(APP2_DEV_key_2).

## Release note

### v2.0.0
- The task now can recursively load secrets from a folders and his subfolders. Or just load secrets from a specific path.

### v1.1.0
- Add Azure authentication method
- Add Radius authentication method
- Improvement of the errors management

### v1.0.0
- Read secret from a KV engine (v1 or v2) and load them into variables.
