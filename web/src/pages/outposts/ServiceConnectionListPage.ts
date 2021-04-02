import { gettext } from "django";
import { customElement, property } from "lit-element";
import { html, TemplateResult } from "lit-html";
import { AKResponse } from "../../api/Client";
import { TableColumn } from "../../elements/table/Table";
import { TablePage } from "../../elements/table/TablePage";

import "./OutpostHealth";
import "../../elements/buttons/SpinnerButton";
import "../../elements/buttons/ModalButton";
import "../../elements/buttons/Dropdown";
import "../../elements/forms/DeleteForm";
import "../../elements/forms/ModalForm";
import "./ServiceConnectionKubernetesForm";
import "./ServiceConnectionDockerForm";
import { until } from "lit-html/directives/until";
import { PAGE_SIZE } from "../../constants";
import { OutpostsApi, ServiceConnection } from "authentik-api";
import { DEFAULT_CONFIG } from "../../api/Config";
import "../../elements/forms/ProxyForm";
import { ifDefined } from "lit-html/directives/if-defined";

@customElement("ak-outpost-service-connection-list")
export class OutpostServiceConnectionListPage extends TablePage<ServiceConnection> {
    pageTitle(): string {
        return "Outpost Service-Connections";
    }
    pageDescription(): string | undefined {
        return "Outpost Service-Connections define how authentik connects to external platforms to manage and deploy Outposts.";
    }
    pageIcon(): string {
        return "pf-icon pf-icon-integration";
    }
    searchEnabled(): boolean {
        return true;
    }

    apiEndpoint(page: number): Promise<AKResponse<ServiceConnection>> {
        return new OutpostsApi(DEFAULT_CONFIG).outpostsServiceConnectionsAllList({
            ordering: this.order,
            page: page,
            pageSize: PAGE_SIZE,
            search: this.search || "",
        });
    }

    columns(): TableColumn[] {
        return [
            new TableColumn("Name", "name"),
            new TableColumn("Type"),
            new TableColumn("Local", "local"),
            new TableColumn("State"),
            new TableColumn(""),
        ];
    }

    @property()
    order = "name";

    row(item: ServiceConnection): TemplateResult[] {
        return [
            html`${item.name}`,
            html`${item.verboseName}`,
            html`${item.local ? "Yes" : "No"}`,
            html`${until(
                new OutpostsApi(DEFAULT_CONFIG).outpostsServiceConnectionsAllState({
                    uuid: item.pk || ""
                }).then((state) => {
                    if (state.healthy) {
                        return html`<i class="fas fa-check pf-m-success"></i> ${state.version}`;
                    }
                    return html`<i class="fas fa-times pf-m-danger"></i> ${gettext("Unhealthy")}`;
                }), html`<ak-spinner></ak-spinner>`)}`,
            html`
            <ak-forms-modal>
                <span slot="submit">
                    ${gettext("Update")}
                </span>
                <span slot="header">
                    ${gettext(`Update ${item.verboseName}`)}
                </span>
                <ak-proxy-form
                    slot="form"
                    .args=${{
                        "scUUID": item.pk
                    }}
                    type=${ifDefined(item.objectType)}
                    .typeMap=${{
                        "docker": "ak-service-connection-docker-form",
                        "kubernetes": "ak-service-connection-kubernetes-form"
                    }}>
                </ak-proxy-form>
                <button slot="trigger" class="pf-c-button pf-m-secondary">
                    ${gettext("Edit")}
                </button>
            </ak-forms-modal>
            <ak-forms-delete
                .obj=${item}
                objectLabel=${gettext("Outpost Service-connection")}
                .delete=${() => {
                    return new OutpostsApi(DEFAULT_CONFIG).outpostsServiceConnectionsAllDelete({
                        uuid: item.pk || ""
                    });
                }}>
                <button slot="trigger" class="pf-c-button pf-m-danger">
                    ${gettext("Delete")}
                </button>
            </ak-forms-delete>`,
        ];
    }

    renderToolbar(): TemplateResult {
        return html`
        <ak-dropdown class="pf-c-dropdown">
            <button class="pf-m-primary pf-c-dropdown__toggle" type="button">
                <span class="pf-c-dropdown__toggle-text">${gettext("Create")}</span>
                <i class="fas fa-caret-down pf-c-dropdown__toggle-icon" aria-hidden="true"></i>
            </button>
            <ul class="pf-c-dropdown__menu" hidden>
                ${until(new OutpostsApi(DEFAULT_CONFIG).outpostsServiceConnectionsAllTypes().then((types) => {
                    return types.map((type) => {
                        return html`<li>
                            <ak-forms-modal>
                                <span slot="submit">
                                    ${gettext("Create")}
                                </span>
                                <span slot="header">
                                    ${gettext(`Create ${type.name}`)}
                                </span>
                                <ak-proxy-form
                                    slot="form"
                                    type=${type.component}>
                                </ak-proxy-form>
                                <button slot="trigger" class="pf-c-dropdown__menu-item">
                                    ${type.name}<br>
                                    <small>${type.description}</small>
                                </button>
                            </ak-forms-modal>
                        </li>`;
                    });
                }), html`<ak-spinner></ak-spinner>`)}
            </ul>
        </ak-dropdown>
        ${super.renderToolbar()}`;
    }

}
