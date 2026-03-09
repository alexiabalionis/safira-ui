import { Button, Group, Modal, Select } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";

import { ErpSelect } from "@/components/ui/erp-select";

type Props = {
  opened: boolean;
  onClose: () => void;
  onSave: (value: {
    fase?: string;
    erp?: string;
    status?: string;
  }) => Promise<void>;
  initialFase?: string;
  initialErp?: string;
  initialStatus?: string;
  faseOptions: string[];
  erpOptions: string[];
  faseLabel?: string;
  erpLabel?: string;
  statusOptions?: string[];
};

export function EditStatusModal({
  opened,
  onClose,
  onSave,
  initialFase,
  initialErp,
  initialStatus,
  faseOptions,
  erpOptions,
  faseLabel,
  erpLabel,
  statusOptions,
}: Props) {
  const [fase, setFase] = useState(initialFase);
  const [erp, setErp] = useState(initialErp);
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!opened) return;
    setFase(initialFase);
    setErp(initialErp);
    setStatus(initialStatus);
  }, [initialErp, initialFase, initialStatus, opened]);

  async function handleSave() {
    if (!fase && !erp && !status) {
      notifications.show({
        color: "yellow",
        message: "Selecione ao menos um campo para atualizar em lote.",
      });
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...(fase ? { fase } : {}),
        ...(erp ? { erp } : {}),
        ...(status ? { status } : {}),
      });
      onClose();
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Falha ao atualizar em lote",
        message:
          error instanceof Error && error.message.trim()
            ? error.message
            : "Nao foi possivel atualizar os postos selecionados.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Editar status" centered>
      <Select
        label={faseLabel ?? "Fase"}
        value={fase ?? null}
        onChange={(value) => setFase(value ?? undefined)}
        data={faseOptions}
        clearable
        placeholder="Não alterar"
        mb={8}
      />
      <ErpSelect
        label={erpLabel ?? "ERP"}
        value={erp ?? null}
        onChange={(value) => setErp(value ?? undefined)}
        options={erpOptions}
        clearable
        placeholder="Não alterar"
        mb={8}
      />
      <Select
        label="Status"
        value={status ?? null}
        onChange={(value) => setStatus(value ?? undefined)}
        data={statusOptions ?? ["Aguardando", "em_andamento", "Finalizado"]}
        clearable
        placeholder="Não alterar"
      />
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>
          Cancelar
        </Button>
        <Button color="safira" loading={saving} onClick={handleSave}>
          Salvar
        </Button>
      </Group>
    </Modal>
  );
}
